"use client";

import { AuthGuard } from "@/components/guards/auth-guard";
import { ProfileForm } from "@/components/forms/profile-form";
import { AnimatedPage } from "@/components/layout/animated-page";
import { PageIntro } from "@/components/layout/page-intro";
import { Card, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/store/user-store";

export default function ProfilePage() {
  const currentUser = useUserStore((state) => state.currentUser);

  return (
    <AnimatedPage>
      <section className="container py-10 md:py-14">
        <div className="space-y-8">
          <PageIntro
            eyebrow="Профиль"
            title="Держи профиль готовым к рекомендациям."
            description="Твои навыки, курс, университет и био помогают DevLink точнее подбирать проекты и команду."
          />

          <AuthGuard description="Войдите, чтобы управлять личным профилем и каталогом навыков.">
            {currentUser ? (
              <ProfileForm currentUser={currentUser} />
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
