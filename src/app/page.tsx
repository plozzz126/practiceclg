import Link from "next/link";
import { ArrowRight, Compass, LayoutDashboard, UsersRound } from "lucide-react";

import { AnimatedPage } from "@/components/layout/animated-page";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/constants/routes";

const highlights = [
  {
    title: "Project discovery",
    description: "Search student projects by stack, deadline and current status.",
    icon: Compass,
    href: routes.projects,
  },
  {
    title: "Teammate matching",
    description: "Browse profiles by skills, course, university and rating.",
    icon: UsersRound,
    href: routes.users,
  },
  {
    title: "Student dashboard",
    description: "Keep your projects, recommendations and profile updates in one place.",
    icon: LayoutDashboard,
    href: routes.dashboard,
  },
];

export default function HomePage() {
  return (
    <AnimatedPage>
      <section className="container py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-8">
            <PageIntro
              eyebrow="Week 3 frontend"
              title="Build your team before the deadline builds pressure."
              description="EduMatch helps students move from solo ideas to working teams with searchable projects, skill-based profiles and a focused dashboard."
              actions={
                <>
                  <Button asChild size="lg">
                    <Link href={routes.register}>
                      Create account
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href={routes.projects}>Explore projects</Link>
                  </Button>
                </>
              }
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-white/90">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Fast onboarding</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-slate-600">
                  Sign up, add skills and move straight into project search.
                </CardContent>
              </Card>
              <Card className="bg-white/90">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Clean filters</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-slate-600">
                  Find relevant people and projects without digging through noise.
                </CardContent>
              </Card>
              <Card className="bg-white/90">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ready for realtime</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-slate-600">
                  Project pages already reserve space for chat and team workflows.
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4">
            {highlights.map(({ title, description, icon: Icon, href }) => (
              <Card key={title} className="group overflow-hidden">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-slate-950">{title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                    <Button asChild variant="ghost" className="px-0 text-teal-800 hover:bg-transparent">
                      <Link href={href}>
                        Open section
                        <ArrowRight className="transition group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
