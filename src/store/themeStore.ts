import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from '../themes';

interface ThemeState {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'fantasy',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'pathfinder-theme' },
  ),
);
