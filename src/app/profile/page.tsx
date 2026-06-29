"use client";

import { useState } from "react";

import { AuthGuard } from "@/components/guards/auth-guard";
import { PrivacySettingsForm } from "@/components/forms/privacy-settings-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { AnimatedPage } from "@/components/layout/animated-page";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/store/user-store";

export default function ProfilePage() {
  const currentUser = useUserStore((state) => state.currentUser);
  const [tab, setTab] = useState<"profile" | "privacy">("profile");

  return (
    <AnimatedPage>
      <section className="container py-10 md:py-14">
        <div className="space-y-8">
          <PageIntro
            eyebrow="Профиль"
            title="Держи профиль готовым к рекомендациям."
            description="Твои навыки, курс, университет и био помогают DevLink точнее подбирать проекты и команду."
          />

          <div className="flex flex-wrap gap-3">
            <Button variant={tab === "profile" ? "default" : "secondary"} onClick={() => setTab("profile")}>
              Основное
            </Button>
            <Button variant={tab === "privacy" ? "default" : "secondary"} onClick={() => setTab("privacy")}>
              Конфиденциальность
            </Button>
          </div>

          <AuthGuard description="Войдите, чтобы управлять личным профилем и каталогом навыков.">
            {currentUser ? (
              tab === "profile" ? <ProfileForm currentUser={currentUser} /> : <PrivacySettingsForm currentUser={currentUser} />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">Загружаем ваш профиль...</CardContent>
              </Card>
            )}
          </AuthGuard>
        </div>
      </section>
    </AnimatedPage>
  );
}
