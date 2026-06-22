"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/constants/routes";
import { useMounted } from "@/lib/hooks/use-mounted";
import { hasValidRefreshToken, useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export function AuthGuard({
  children,
  title = "Войдите, чтобы продолжить",
  description = "Этот раздел доступен только авторизованным студентам.",
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const mounted = useMounted();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useUserStore((state) => state.currentUser);

  if (!mounted || !isHydrated || ((accessToken || hasValidRefreshToken()) && !currentUser)) {
    return (
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center p-6 text-sm text-muted-foreground">
          Загружаем рабочее пространство...
        </CardContent>
      </Card>
    );
  }

  if (!accessToken && !hasValidRefreshToken()) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href={routes.login}>Войти</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={routes.register}>Регистрация</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
