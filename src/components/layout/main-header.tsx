"use client";

import Link from "next/link";
import { FolderKanban, LayoutDashboard, LogOut, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import { authApi } from "@/lib/api/auth";
import { forceLogout } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/helpers";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

const navItems = [
  { href: routes.dashboard, label: "Дашборд", icon: LayoutDashboard },
  { href: routes.projects, label: "Проекты", icon: FolderKanban },
  { href: routes.users, label: "Тиммейты", icon: UsersRound },
  { href: routes.profile, label: "Профиль", icon: UserRound },
] as const;

export function MainHeader({ hidden = false }: { hidden?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const currentUser = useUserStore((state) => state.currentUser);

  if (hidden) {
    return null;
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      toast.error("Сервис завершения сессии недоступен, но локальный выход уже выполнен.");
    } finally {
      forceLogout();
      router.push(routes.login);
    }
  };

  const renderNavLink = (item: (typeof navItems)[number], compact = false) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-[8px] text-sm font-medium transition",
          compact ? "min-w-16 flex-col gap-1 px-3 py-2 text-xs" : "px-4 py-3",
          active
            ? "tone-primary-soft border"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            active ? "text-tone-primary" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-[216px] flex-col rounded-[16px] border border-border bg-card/88 p-4 shadow-soft backdrop-blur-xl md:flex">
        <Logo />

        <nav className="mt-10 grid gap-2">{navItems.map((item) => renderNavLink(item))}</nav>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          {accessToken && currentUser ? (
            <>
              <Link href={routes.profile} className="flex items-center gap-3 rounded-[8px] bg-muted/70 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentUser.avatar_url ?? undefined} alt={currentUser.full_name} />
                  <AvatarFallback>{getInitials(currentUser.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{currentUser.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {currentUser.university || "Профиль студента"}
                  </p>
                </div>
              </Link>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut />
                Выйти
              </Button>
            </>
          ) : (
            <div className="grid gap-2">
              <Button asChild>
                <Link href={routes.login}>Войти</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={routes.register}>Регистрация</Link>
              </Button>
            </div>
          )}
        </div>
      </aside>

      <nav className="fixed bottom-3 left-3 right-3 z-40 flex justify-between gap-1 rounded-[16px] border border-border bg-card/92 p-2 shadow-soft backdrop-blur-xl md:hidden">
        {navItems.slice(0, 3).map((item) => renderNavLink(item, true))}
        {renderNavLink(navItems[3], true)}
      </nav>
    </>
  );
}
