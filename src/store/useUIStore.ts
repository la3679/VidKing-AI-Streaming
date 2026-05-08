import { create } from 'zustand';
import { Movie } from '../types';

interface UIState {
  isAssistantOpen: boolean;
  isAuthOpen: boolean;
  isWatchlistOpen: boolean;
  searchQuery: string;
  selectedMedia: Movie | null;
  selectedActorId: string | null;
  toggleAssistant: () => void;
  setIsAuthOpen: (isOpen: boolean) => void;
  setIsWatchlistOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedMedia: (media: Movie | null) => void;
  setSelectedActorId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAssistantOpen: false,
  isAuthOpen: false,
  isWatchlistOpen: false,
  searchQuery: '',
  selectedMedia: null,
  selectedActorId: null,
  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
  setIsAuthOpen: (isOpen) => set({ isAuthOpen: isOpen }),
  setIsWatchlistOpen: (isOpen) => set({ isWatchlistOpen: isOpen }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedMedia: (media) => set({ selectedMedia: media }),
  setSelectedActorId: (id) => set({ selectedActorId: id }),
}));
