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
            eyebrow="Profile"
            title="Keep your profile recommendation-ready."
            description="Your skills, course, university and bio power project discovery and teammate matching."
          />

          <AuthGuard description="Log in to manage your personal profile and skills catalog.">
            {currentUser ? (
              <ProfileForm currentUser={currentUser} />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-slate-500">Loading your profile...</CardContent>
              </Card>
            )}
          </AuthGuard>
        </div>
      </section>
    </AnimatedPage>
  );
}
