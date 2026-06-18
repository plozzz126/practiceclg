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
import { projectStatusOptions } from "@/constants/project-status";
import { queryKeys } from "@/constants/query-keys";
import { useSkillsCatalog } from "@/lib/hooks/use-skills-catalog";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { projectsApi } from "@/lib/api/projects";
import { useAuthStore } from "@/store/auth-store";
import type { ProjectStatus } from "@/constants/project-status";

export function ProjectsBrowser() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { skills } = useSkillsCatalog();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  const debouncedQuery = useDebouncedValue(query);
  const skillParam = selectedSkillIds.join(",");

  const params = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      status: status === "all" ? undefined : status,
      sort,
      skills: skillParam || undefined,
    }),
    [debouncedQuery, skillParam, sort, status],
  );

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () => projectsApi.list(params),
  });

  return (
    <section className="container py-10 md:py-14">
      <div className="space-y-8">
        <PageIntro
          eyebrow="Projects"
          title="Search projects by stack, timing and readiness."
          description="Use the filters below to find active student projects that match your skills and current workload."
          actions={accessToken ? <CreateProjectDialog /> : undefined}
        />

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
              <ListFilter className="h-4 w-4" />
              Filters
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.45fr_0.45fr]">
              <div>
                <Label htmlFor="project-search">Search by title</Label>
                <Input
                  id="project-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="AI study assistant, hackathon team, product lab..."
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as "all" | ProjectStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {projectStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort by date</Label>
                <Select value={sort} onValueChange={(value: "asc" | "desc") => setSort(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest first</SelectItem>
                    <SelectItem value="asc">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Required skills</Label>
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
                <SkillPicker skills={skills} selectedIds={selectedSkillIds} onChange={setSelectedSkillIds} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => {
                setQuery("");
                setStatus("all");
                setSort("desc");
                setSelectedSkillIds([]);
              }}>
                Reset filters
              </Button>
              <p className="self-center text-sm text-slate-500">
                {projectsQuery.data?.items.length ?? 0} project(s) found
              </p>
            </div>
          </CardContent>
        </Card>

        {projectsQuery.data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {projectsQuery.data.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No projects match these filters"
            description="Try a broader query, fewer required skills or a different status."
          />
        )}
      </div>
    </section>
  );
}
