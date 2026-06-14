"use client";

import Link from "next/link";
import { LogOut, MenuSquare, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationLinks, routes } from "@/constants/routes";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/helpers";
import { forceLogout } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export function MainHeader() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const currentUser = useUserStore((state) => state.currentUser);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      toast.error("We could not reach the session service, but you were signed out locally.");
    } finally {
      forceLogout();
      router.push(routes.login);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-background/85 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-2 md:flex">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-slate-950",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href={routes.projects} className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <MenuSquare />
            </Button>
          </Link>

          {accessToken && currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full border border-white/70 bg-white/70 px-2 py-2 shadow-sm transition hover:shadow-soft">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatar_url ?? undefined} alt={currentUser.full_name} />
                    <AvatarFallback>{getInitials(currentUser.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold text-slate-900">{currentUser.full_name}</p>
                    <p className="text-xs text-slate-500">{currentUser.university || "Student profile"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={routes.dashboard}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={routes.profile}>
                    <UserRound className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href={routes.login}>Log in</Link>
              </Button>
              <Button asChild>
                <Link href={routes.register}>Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
