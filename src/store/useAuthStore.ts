import { create } from 'zustand';
import { User, signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logger } from '../lib/logger';
import { toast } from './useToastStore';

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
    set({ user, loading: false });
    if (user) {
      get().fetchProfile(user.uid);
    } else {
      set({ profile: null });
    }
  },
  fetchProfile: async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ profile: docSnap.data() as UserProfile });
      } else {
        // Create default profile
        const user = auth.currentUser;
        if (user) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            preferences: { favoriteGenres: [], theme: 'dark' },
          };
          await setDoc(docRef, newProfile);
          set({ profile: newProfile });
        }
      }
    } catch (error) {
      // A profile read/write failure must not break the session.
      logger.warn('Could not load user profile:', error);
    }
  },
  isLiked: (tmdbId) => Boolean(get().profile?.preferences?.likedIds?.includes(tmdbId)),

  toggleLike: async (tmdbId) => {
    const { user, profile } = get();
    if (!user || !profile) return; // caller prompts sign-in for guests

    const prefs = profile.preferences ?? { favoriteGenres: [], theme: 'dark' as const };
    const current = prefs.likedIds ?? [];
    const wasLiked = current.includes(tmdbId);
    const nextLiked = wasLiked ? current.filter((id) => id !== tmdbId) : [...current, tmdbId];

    // Optimistic update with rollback on failure.
    const previous = profile;
    set({ profile: { ...profile, preferences: { ...prefs, likedIds: nextLiked } } });

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { preferences: { ...prefs, likedIds: nextLiked } },
        { merge: true },
      );
      toast.success(wasLiked ? 'Removed from your likes' : 'Added to your likes');
    } catch (error) {
      set({ profile: previous });
      logger.error('Failed to update likes:', error);
      toast.error('Could not update likes. Please try again.');
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
