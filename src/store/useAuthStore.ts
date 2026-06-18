import { create } from 'zustand';
import { User, signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logger } from '../lib/logger';
import { toast } from './useToastStore';
import { loadLocal, saveLocal } from '../lib/localPersist';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchProfile: (uid: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  /** Toggles a "like"/favorite for a TMDB id (persisted in preferences). */
  toggleLike: (tmdbId: string) => Promise<void>;
  isLiked: (tmdbId: string) => boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => {
    if (user) {
      // Derive a profile from the auth user IMMEDIATELY so the header/avatar
      // never waits on (or breaks because of) Firestore. Firestore then
      // enriches it in the background.
      set({
        user,
        loading: false,
        profile: {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          // Hydrate likes from localStorage so they survive a refresh even
          // without Firestore; fetchProfile merges the cloud copy when available.
          preferences: { favoriteGenres: [], theme: 'dark', likedIds: loadLocal<string[]>('likes', user.uid, []) },
        },
      });
      get().fetchProfile(user.uid);
    } else {
      set({ user: null, profile: null, loading: false });
    }
  },
  fetchProfile: async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Merge Firestore data over the auth-derived fallback.
        const data = docSnap.data() as UserProfile;
        set((s) => ({ profile: { ...(s.profile as UserProfile), ...data } }));
      } else {
        // Best-effort: persist the auth-derived profile as the initial doc.
        const cur = get().profile;
        if (cur) await setDoc(docRef, cur, { merge: true });
      }
    } catch (error) {
      // A Firestore failure must NOT clear the auth-derived profile.
      logger.warn('Could not load user profile (using auth fallback):', error);
    }
  },
  isLiked: (tmdbId) => Boolean(get().profile?.preferences?.likedIds?.includes(tmdbId)),

  toggleLike: async (tmdbId) => {
    const { user, profile } = get();
    if (!user) return; // caller prompts sign-in for guests

    const base = profile ?? {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      preferences: { favoriteGenres: [], theme: 'dark' as const },
    };
    const prefs = base.preferences ?? { favoriteGenres: [], theme: 'dark' as const };
    const current = prefs.likedIds ?? [];
    const wasLiked = current.includes(tmdbId);
    const nextLiked = wasLiked ? current.filter((id) => id !== tmdbId) : [...current, tmdbId];

    // Optimistic update + persist locally immediately (survives refresh).
    set({ profile: { ...base, preferences: { ...prefs, likedIds: nextLiked } } });
    saveLocal('likes', user.uid, nextLiked);

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { preferences: { ...prefs, likedIds: nextLiked } },
        { merge: true },
      );
      toast.success(wasLiked ? 'Removed from your likes' : 'Added to your likes');
    } catch (error) {
      // Firestore unavailable — keep the local change (already saved) instead of
      // reverting, so likes still work.
      logger.warn('Likes cloud sync failed; kept local copy:', error);
      toast.success(wasLiked ? 'Removed from your likes' : 'Added to your likes');
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      logger.error('Sign out failed:', error);
    }
  },
  updateProfile: async (updates) => {
    const { profile, user } = get();
    if (!profile || !user) return;
    const updated = { ...profile, ...updates };
    await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
    set({ profile: updated });
  }
}));
