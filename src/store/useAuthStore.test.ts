import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/firebase', () => ({ auth: {}, db: {} }));
vi.mock('firebase/auth', () => ({ signOut: vi.fn(() => Promise.resolve()) }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
}));
vi.mock('./useToastStore', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useAuthStore } from './useAuthStore';
import { setDoc } from 'firebase/firestore';

const baseProfile = {
  uid: 'u1',
  email: 'a@b.co',
  displayName: 'Test',
  photoURL: '',
  preferences: { favoriteGenres: [], theme: 'dark' as const, likedIds: [] as string[] },
};

describe('useAuthStore likes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: { uid: 'u1' } as any, profile: { ...baseProfile } });
  });

  it('isLiked reflects preferences.likedIds', () => {
    expect(useAuthStore.getState().isLiked('5')).toBe(false);
    useAuthStore.setState({
      profile: { ...baseProfile, preferences: { ...baseProfile.preferences, likedIds: ['5'] } },
    });
    expect(useAuthStore.getState().isLiked('5')).toBe(true);
  });

  it('toggleLike adds then removes an id and persists', async () => {
    await useAuthStore.getState().toggleLike('550');
    expect(useAuthStore.getState().isLiked('550')).toBe(true);
    expect(setDoc).toHaveBeenCalledTimes(1);

    await useAuthStore.getState().toggleLike('550');
    expect(useAuthStore.getState().isLiked('550')).toBe(false);
    expect(setDoc).toHaveBeenCalledTimes(2);
  });

  it('keeps the like locally when the cloud write fails (offline fallback)', async () => {
    (setDoc as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('offline'));
    await useAuthStore.getState().toggleLike('99');
    // Firestore failed, but the like persists via the local fallback.
    expect(useAuthStore.getState().isLiked('99')).toBe(true);
  });

  it('toggleLike is a no-op for guests', async () => {
    useAuthStore.setState({ user: null, profile: null });
    await useAuthStore.getState().toggleLike('1');
    expect(setDoc).not.toHaveBeenCalled();
  });
});
