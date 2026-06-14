"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { usersApi } from "@/lib/api/users";
import { hasValidRefreshToken, useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: usersApi.getMe,
    enabled: isHydrated && Boolean(accessToken || hasValidRefreshToken()),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setCurrentUser(meQuery.data);
    }
  }, [meQuery.data, setCurrentUser]);

  useEffect(() => {
    if (meQuery.isError) {
      clearSession();
      clearUser();
    }
  }, [clearSession, clearUser, meQuery.isError]);

  return <>{children}</>;
}
