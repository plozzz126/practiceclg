"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/store/theme-store";

export function ThemeBootstrap() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return null;
}
