import Link from "next/link";
import { CalendarDays, FolderGit2, Layers3, Target, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProjectDirectionLabel } from "@/constants/project-directions";
import { getProjectStatusLabel } from "@/constants/project-status";
import { formatDate, formatRelativeDate } from "@/lib/utils/format";
import type { Project } from "@/types/project";

function getStatusVariant(status: Project["status"]) {
  if (status === "open") {
    return "default";
  }

  if (status === "closed") {
    return "warning";
  }

  return "secondary";
}

export function ProjectCard({
  project,
  action,
}: {
  project: Project;
  action?: React.ReactNode;
}) {
  return (
    <Card className="h-full transition hover:-translate-y-1">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(project.status)}>{getProjectStatusLabel(project.status)}</Badge>
              <Badge variant="secondary">{getProjectDirectionLabel(project.direction)}</Badge>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {formatRelativeDate(project.created_at)}
              </span>
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold text-foreground">{project.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Лид проекта: {project.owner.full_name}</p>
            </div>
          </div>
          <div className="tone-warning-soft flex h-12 w-12 items-center justify-center rounded-[8px] border">
            <FolderGit2 className="h-6 w-6" />
          </div>
        </div>

        <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{project.description}</p>

        {project.required_roles?.length ? (
          <div className="flex flex-wrap gap-2">
            {project.required_roles.slice(0, 4).map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {project.required_skills.length ? (
            project.required_skills.map((skill) => (
              <Badge key={skill.id} variant="outline">
                {skill.name}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary">Навыки еще не заданы</Badge>
          )}
        </div>

        <div className="grid gap-3 rounded-[8px] bg-muted/60 p-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(project.deadline)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              Команда {project.participants_count}/{project.team_size}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            <span>Навыков: {project.required_skills.length}</span>
          </div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>Ролей: {project.required_roles?.length || 1}</span>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={`/projects/${project.id}`}>Открыть проект</Link>
          </Button>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
