"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListFilter } from "lucide-react";

import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { PageIntro } from "@/components/layout/page-intro";
import { ProjectCard } from "@/components/project/project-card";
import { SkillPicker } from "@/components/forms/skill-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectDirections, type ProjectDirection } from "@/constants/project-directions";
import { projectStatusOptions } from "@/constants/project-status";
import { queryKeys } from "@/constants/query-keys";
import { useSkillsCatalog } from "@/lib/hooks/use-skills-catalog";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { projectsApi } from "@/lib/api/projects";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";
import type { ProjectStatus } from "@/constants/project-status";
import type { Skill } from "@/types/skill";

const popularTechnologies = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Python",
  "Go",
  "PostgreSQL",
  "Docker",
  "Figma",
  "Cybersecurity",
  "CTF",
  "TensorFlow",
];

export function ProjectsBrowser() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useUserStore((state) => state.currentUser);
  const { skills } = useSkillsCatalog();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [direction, setDirection] = useState<"all" | ProjectDirection>("all");
  const [sort, setSort] = useState<"desc" | "asc" | "deadline">("desc");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  const debouncedQuery = useDebouncedValue(query);
  const skillParam = selectedSkillIds.join(",");

  const params = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      status: status === "all" ? undefined : status,
      direction: direction === "all" ? undefined : direction,
      sort,
      skills: skillParam || undefined,
    }),
    [debouncedQuery, direction, skillParam, sort, status],
  );

  const popularSkillButtons = useMemo(
    () =>
      popularTechnologies
        .map((name) => skills.find((skill) => skill.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as Skill[],
    [skills],
  );

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  };

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () => projectsApi.list(params),
  });

  const myProjectsQuery = useQuery({
    queryKey: queryKeys.myProjects,
    queryFn: () => projectsApi.listMine(),
    enabled: Boolean(accessToken && currentUser),
  });

  const participatingProjectsQuery = useQuery({
    queryKey: queryKeys.participatingProjects,
    queryFn: () => projectsApi.listParticipating(),
    enabled: Boolean(accessToken && currentUser),
  });

  return (
    <section className="container py-10 md:py-14">
      <div className="space-y-8">
        <PageIntro
          eyebrow="Проекты"
          title="Ищи проекты по стеку, срокам и готовности команды."
          description="Используй фильтры, чтобы находить активные студенческие проекты под свои навыки и текущую загрузку."
          actions={accessToken ? <CreateProjectDialog /> : undefined}
        />

        {accessToken && currentUser ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">Мои проекты</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Здесь собраны проекты, которые ты создал и которыми управляешь сам.
                  </p>
                </div>

                {myProjectsQuery.data?.items.length ? (
                  <div className="grid gap-4">
                    {myProjectsQuery.data.items.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    className="min-h-40"
                    title="Своих проектов пока нет"
                    description="Создай первый проект, чтобы собирать команду и приглашать людей напрямую."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">Участвую</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Проекты, где ты уже в команде, но не являешься владельцем.
                  </p>
                </div>

                {participatingProjectsQuery.data?.items.length ? (
                  <div className="grid gap-4">
                    {participatingProjectsQuery.data.items.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    className="min-h-40"
                    title="Пока ни в одной команде"
                    description="Когда тебя примут или пригласят в проект, он появится в этом блоке."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              <ListFilter className="h-4 w-4" />
              Фильтры
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.45fr_0.45fr_0.45fr]">
              <div>
                <Label htmlFor="project-search">Поиск</Label>
                <Input
                  id="project-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="React, CTF, кибербез, хакатон, backend..."
                />
              </div>

              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as "all" | ProjectStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {projectStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Направление</Label>
                <Select value={direction} onValueChange={(value) => setDirection(value as "all" | ProjectDirection)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите направление" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все направления</SelectItem>
                    {projectDirections.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Сортировка</Label>
                <Select value={sort} onValueChange={(value: "asc" | "desc" | "deadline") => setSort(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите порядок" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Сначала новые</SelectItem>
                    <SelectItem value="asc">Сначала старые</SelectItem>
                    <SelectItem value="deadline">Ближайший дедлайн</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Популярные технологии</Label>
              <div className="flex flex-wrap gap-2">
                {popularSkillButtons.map((skill) => {
                  const selected = selectedSkillIds.includes(skill.id);

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={
                        selected
                          ? "rounded-full border border-teal-500 bg-teal-500 px-4 py-2 text-sm font-medium text-white"
                          : "rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-teal-400 hover:text-foreground"
                      }
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Требуемые навыки</Label>
              <div className="rounded-[8px] border border-border bg-muted/60 p-4">
                <SkillPicker skills={skills} selectedIds={selectedSkillIds} onChange={setSelectedSkillIds} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setDirection("all");
                  setSort("desc");
                  setSelectedSkillIds([]);
                }}
              >
                Сбросить фильтры
              </Button>
              <p className="self-center text-sm text-muted-foreground">
                Найдено проектов: {projectsQuery.data?.items.length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Все проекты</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Общий каталог для поиска новых команд, задач и направлений под твой стек.
          </p>
        </div>

        {projectsQuery.data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectsQuery.data.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="По этим фильтрам ничего не найдено"
            description="Попробуй расширить запрос, убрать часть навыков или сменить статус."
          />
        )}
      </div>
    </section>
  );
}
