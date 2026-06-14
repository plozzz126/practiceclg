"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { storageKeys } from "@/constants/storage";
import type { Skill } from "@/types/skill";
import type { CurrentUser } from "@/types/user";

interface UserState {
  currentUser: CurrentUser | null;
  cachedSkills: Skill[];
  setCurrentUser: (user: CurrentUser | null) => void;
  setCachedSkills: (skills: Skill[]) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      cachedSkills: [],
      setCurrentUser: (currentUser) => set({ currentUser }),
      setCachedSkills: (cachedSkills) => set({ cachedSkills }),
      clearUser: () => set({ currentUser: null, cachedSkills: [] }),
    }),
    {
      name: storageKeys.user,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        cachedSkills: state.cachedSkills,
      }),
    },
  ),
);
