"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { storageKeys } from "@/constants/storage";
import type { TokenPair } from "@/types/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  isHydrated: boolean;
  isRefreshing: boolean;
  setSession: (tokens: TokenPair) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
  setRefreshing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      isHydrated: false,
      isRefreshing: false,
      setSession: (tokens) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          accessTokenExpiresAt: tokens.access_token_expires_at,
          refreshTokenExpiresAt: tokens.refresh_token_expires_at,
        }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          isRefreshing: false,
        }),
      setHydrated: (value) => set({ isHydrated: value }),
      setRefreshing: (value) => set({ isRefreshing: value }),
    }),
    {
      name: storageKeys.auth,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        refreshTokenExpiresAt: state.refreshTokenExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function hasValidRefreshToken() {
  const refreshExpiresAt = useAuthStore.getState().refreshTokenExpiresAt;
  if (!refreshExpiresAt) {
    return false;
  }

  return new Date(refreshExpiresAt).getTime() > Date.now();
}
