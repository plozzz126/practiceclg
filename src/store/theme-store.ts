"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { storageKeys } from "@/constants/storage";

export type ThemeMode = "dark" | "light";

interface ThemeState {
  theme: ThemeMode;
  isHydrated: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setHydrated: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      isHydrated: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: storageKeys.theme,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
