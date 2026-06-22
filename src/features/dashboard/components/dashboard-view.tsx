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
    <AuthGuard description="Войдите, чтобы хранить в одном месте профиль, проекты и персональные рекомендации.">
      <section className="container py-10 md:py-14">
        <div className="space-y-8">
          <PageIntro
            eyebrow="Дашборд"
            title={currentUser ? `С возвращением, ${currentUser.full_name.split(" ")[0]}` : "Твое рабочее пространство"}
            description="Следи за своими проектами, находи подходящие возможности и держи профиль готовым к новым заявкам."
            actions={<CreateProjectDialog />}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Мои проекты</p>
                <p className="mt-3 font-display text-4xl font-semibold text-foreground">
                  {dashboard.myProjects.length}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Проекты, которые ты создал или ведешь сейчас.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Подходят сейчас</p>
                <p className="mt-3 font-display text-4xl font-semibold text-foreground">
                  {dashboard.recommendedProjects.length}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Открытые проекты, близкие к твоим навыкам.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Подходящие люди</p>
                <p className="mt-3 font-display text-4xl font-semibold text-foreground">
                  {dashboard.matchingUsers.length}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Студенты, с которыми совпадает хотя бы один ключевой навык.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">Мои проекты</h2>
                  <p className="mt-1 text-sm text-muted-foreground">То, что можно продолжить и усилить уже на этой неделе.</p>
                </div>
                <Button asChild variant="ghost">
                  <Link href={routes.projects}>
                    Все проекты
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
                  title="Проектов пока нет"
                  description="Создай первый проект, чтобы начать собирать команду из каталога."
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
                    Рекомендованные проекты
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.recommendedProjects.length ? (
                    dashboard.recommendedProjects.map((project) => <ProjectCard key={project.id} project={project} />)
                  ) : (
                    <EmptyState
                      className="min-h-52"
                      title="Рекомендации появятся здесь"
                      description="Добавь больше навыков в профиль или открой весь каталог проектов."
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <UserRoundSearch className="h-5 w-5 text-tone-primary" />
                    Тиммейты по твоим навыкам
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.matchingUsers.length ? (
                    dashboard.matchingUsers.map((user) => <UserCard key={user.id} user={user} />)
                  ) : (
                    <EmptyState
                      className="min-h-52"
                      title="Прямых совпадений пока нет"
                      description="Заполни ключевые навыки в профиле, и DevLink покажет более точных тиммейтов."
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
