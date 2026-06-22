"use client";

import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/hooks/use-mounted";
import { useThemeStore } from "@/store/theme-store";

export function ThemeToggle() {
  const mounted = useMounted();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-50 border-border/80 bg-card/90 backdrop-blur-xl md:right-6 md:top-6"
      aria-label={isDark ? "Включить светлую тему" : "Включить темную тему"}
      title={isDark ? "Включить светлую тему" : "Включить темную тему"}
    >
      {isDark ? <SunMedium /> : <MoonStar />}
      <span className="hidden sm:inline">{isDark ? "Светлая тема" : "Темная тема"}</span>
    </Button>
  );
}
