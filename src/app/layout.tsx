import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/layout/providers";
import { storageKeys } from "@/constants/storage";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

const displayFont = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "DevLink",
  description: "Платформа для поиска проектов, тиммейтов и совместной работы студентов.",
};

const themeScript = `
(() => {
  try {
    const raw = localStorage.getItem("${storageKeys.theme}");
    let theme = "dark";

    if (raw) {
      const parsed = JSON.parse(raw);
      const savedTheme = parsed?.state?.theme;
      if (savedTheme === "light" || savedTheme === "dark") {
        theme = savedTheme;
      }
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
