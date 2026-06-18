import Link from "next/link";
import { CalendarDays, FolderGit2, Layers3, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
              <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {formatRelativeDate(project.created_at)}
              </span>
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold text-slate-950">{project.title}</h3>
              <p className="mt-1 text-sm text-slate-500">Created by {project.owner.full_name}</p>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-50 text-amber-700">
            <FolderGit2 className="h-6 w-6" />
          </div>
        </div>

        <p className="line-clamp-4 text-sm leading-6 text-slate-600">{project.description}</p>

        <div className="flex flex-wrap gap-2">
          {project.required_skills.length ? (
            project.required_skills.map((skill) => (
              <Badge key={skill.id} variant="outline">
                {skill.name}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary">Skills to be defined</Badge>
          )}
        </div>

        <div className="grid gap-3 rounded-[24px] bg-slate-50/80 p-4 text-sm text-slate-600 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>{formatDate(project.deadline)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{project.participants_count} participants</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-slate-400" />
            <span>{project.required_skills.length} skills</span>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={`/projects/${project.id}`}>Open project</Link>
          </Button>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
