"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderKanban, Sparkles, UserRoundSearch } from "lucide-react";

import { AuthGuard } from "@/components/guards/auth-guard";
import { PageIntro } from "@/components/layout/page-intro";
import { ProjectCard } from "@/components/project/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UserCard } from "@/components/user/user-card";
import { queryKeys } from "@/constants/query-keys";
import { routes } from "@/constants/routes";
import { projectsApi } from "@/lib/api/projects";
import { usersApi } from "@/lib/api/users";
import { useUserStore } from "@/store/user-store";
import type { Project } from "@/types/project";

import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";

function getProjectScore(project: Project, userSkillIds: string[]) {
  const overlap = project.required_skills.filter((skill) => userSkillIds.includes(skill.id)).length;
  const freshness = new Date(project.created_at).getTime();
  return overlap * 10000000000000 + freshness;
}

export function DashboardView() {
  const currentUser = useUserStore((state) => state.currentUser);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => projectsApi.list(),
  });

  const primarySkillId = currentUser?.skills[0]?.id;
  const matchesQuery = useQuery({
    queryKey: queryKeys.users({ skill: primarySkillId }),
    queryFn: () => usersApi.list({ skill: primarySkillId }),
    enabled: Boolean(primarySkillId),
  });

  const dashboard = useMemo(() => {
    if (!currentUser) {
      return {
        myProjects: [],
        recommendedProjects: [],
        matchingUsers: [],
      };
    }

    const projectItems = projectsQuery.data?.items ?? [];
    const userSkillIds = currentUser.skills.map((skill) => skill.id);

    const myProjects = projectItems.filter((project) => project.owner_id === currentUser.id);
    const recommendedProjects = projectItems
      .filter((project) => project.owner_id !== currentUser.id && project.status === "open")
      .sort((left, right) => getProjectScore(right, userSkillIds) - getProjectScore(left, userSkillIds))
      .slice(0, 3);

    const matchingUsers = (matchesQuery.data?.items ?? []).filter((user) => user.id !== currentUser.id).slice(0, 3);

    return {
      myProjects,
      recommendedProjects,
      matchingUsers,
    };
  }, [currentUser, matchesQuery.data?.items, projectsQuery.data?.items]);

  return (
    <AuthGuard description="Log in to keep your profile, projects and recommendations together.">
      <section className="container py-10 md:py-14">
        <div className="space-y-8">
          <PageIntro
            eyebrow="Dashboard"
            title={currentUser ? `Welcome back, ${currentUser.full_name.split(" ")[0]}` : "Your workspace"}
            description="Track your own projects, discover matching opportunities and keep your profile ready for new teammates."
            actions={<CreateProjectDialog />}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500">My projects</p>
                <p className="mt-3 font-display text-4xl font-semibold text-slate-950">
                  {dashboard.myProjects.length}
                </p>
                <p className="mt-2 text-sm text-slate-600">Projects you created or currently own.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500">Recommended now</p>
                <p className="mt-3 font-display text-4xl font-semibold text-slate-950">
                  {dashboard.recommendedProjects.length}
                </p>
                <p className="mt-2 text-sm text-slate-600">Open projects aligned with your skills.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500">Matching people</p>
                <p className="mt-3 font-display text-4xl font-semibold text-slate-950">
                  {dashboard.matchingUsers.length}
                </p>
                <p className="mt-2 text-sm text-slate-600">Students sharing at least one key skill.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">My projects</h2>
                  <p className="mt-1 text-sm text-slate-500">Projects you can continue shaping this week.</p>
                </div>
                <Button asChild variant="ghost">
                  <Link href={routes.projects}>
                    View all
                    <ArrowRight />
                  </Link>
                </Button>
              </div>

              {dashboard.myProjects.length ? (
                <div className="grid gap-4">
                  {dashboard.myProjects.slice(0, 3).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No projects yet"
                  description="Create your first project to start attracting teammates from the catalog."
                  icon={<FolderKanban className="h-6 w-6" />}
                  action={<CreateProjectDialog />}
                />
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Recommended projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.recommendedProjects.length ? (
                    dashboard.recommendedProjects.map((project) => <ProjectCard key={project.id} project={project} />)
                  ) : (
                    <EmptyState
                      className="min-h-52"
                      title="Recommendations will appear here"
                      description="Add more skills to your profile or explore the full project catalog."
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <UserRoundSearch className="h-5 w-5 text-teal-600" />
                    Teammates matching your skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.matchingUsers.length ? (
                    dashboard.matchingUsers.map((user) => <UserCard key={user.id} user={user} />)
                  ) : (
                    <EmptyState
                      className="min-h-52"
                      title="No direct matches yet"
                      description="Set your core skills in the profile and EduMatch will surface stronger teammate suggestions."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </AuthGuard>
  );
}
