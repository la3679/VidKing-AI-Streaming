import { create } from 'zustand';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { WatchProgress } from '../types';

interface PlayerState {
  currentProgress: WatchProgress | null;
  saveProgress: (userId: string, progress: Partial<WatchProgress>) => Promise<void>;
  trackInteraction: (userId: string, type: 'click' | 'view' | 'skip' | 'pause' | 'rewatch' | 'search', itemId?: string, metadata?: any) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentProgress: null,
  saveProgress: async (userId, data) => {
    if (!data.tmdbId) return;
    
    const path = `users/${userId}/progress/${data.tmdbId}`;
    try {
      const completionRate = data.duration ? (data.progress || 0) / data.duration : 0;
      const progressData = {
        ...data,
        completionRate,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, path), {
        ...progressData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  trackInteraction: async (userId, type, itemId, metadata) => {
    const interactionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const path = `users/${userId}/interactions/${interactionId}`;
    
    try {
      await setDoc(doc(db, path), {
        type,
        itemId: itemId || null,
        metadata: metadata || {},
        timestamp: serverTimestamp(),
        session: window.sessionStorage.getItem('ai_session_id') || 'default'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}));
