"use client";

import { useMemo } from "react";

import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const currentUser = useUserStore((state) => state.currentUser);

  return useMemo(
    () => ({
      accessToken,
      refreshToken,
      isHydrated,
      currentUser,
      isAuthenticated: Boolean(accessToken && refreshToken && currentUser),
    }),
    [accessToken, currentUser, isHydrated, refreshToken],
  );
}
