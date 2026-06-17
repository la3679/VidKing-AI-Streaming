import { create } from 'zustand';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { WatchProgress } from '../types';
import { logger } from '../lib/logger';

export interface ResumeInfo {
  /** Saved playback position in seconds. */
  currentTime: number;
  /** Fraction watched (0-1). */
  completionRate: number;
}

interface PlayerState {
  currentProgress: WatchProgress | null;
  saveProgress: (userId: string, progress: Partial<WatchProgress>) => Promise<void>;
  /** Fetches saved progress for resume. Returns null when none / unavailable. */
  getProgress: (userId: string, tmdbId: string) => Promise<ResumeInfo | null>;
  trackInteraction: (
    userId: string,
    type: 'click' | 'view' | 'skip' | 'pause' | 'rewatch' | 'search',
    itemId?: string,
    metadata?: any,
  ) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentProgress: null,

  saveProgress: async (userId, data) => {
    if (!data.tmdbId) return;

    const path = `users/${userId}/progress/${data.tmdbId}`;
    try {
      // `progress` is a percentage (0-100); `timestamp` is the playback position
      // in seconds. completionRate (0-1) is derived for resume/continue-watching.
      const completionRate = data.duration ? (data.timestamp || 0) / data.duration : 0;
      const progressData: Partial<WatchProgress> & { completionRate: number } = {
        ...data,
        completionRate,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, path),
        { ...progressData, updatedAt: serverTimestamp() },
        { merge: true },
      );

      set({ currentProgress: progressData as WatchProgress });
    } catch (error) {
      // Don't crash playback over a failed write — log and move on.
      logger.error('Failed to save progress:', error);
    }
  },

  getProgress: async (userId, tmdbId) => {
    const path = `users/${userId}/progress/${tmdbId}`;
    try {
      const snap = await getDoc(doc(db, path));
      if (!snap.exists()) return null;
      const data = snap.data() as { timestamp?: number; completionRate?: number };
      return {
        currentTime: Number(data.timestamp) || 0,
        completionRate: Number(data.completionRate) || 0,
      };
    } catch (error) {
      logger.warn('Could not load saved progress:', error);
      return null;
    }
  },

  trackInteraction: async (userId, type, itemId, metadata) => {
    const interactionId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const path = `users/${userId}/interactions/${interactionId}`;

    try {
      await setDoc(doc(db, path), {
        type,
        itemId: itemId || null,
        metadata: metadata || {},
        timestamp: serverTimestamp(),
        session: window.sessionStorage.getItem('ai_session_id') || 'default',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
}));
