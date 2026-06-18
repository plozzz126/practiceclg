"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  MessageSquareText,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProjectForm } from "@/components/forms/project-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { queryKeys } from "@/constants/query-keys";
import { routes } from "@/constants/routes";
import { projectsApi } from "@/lib/api/projects";
import { formatDate, formatRelativeDate } from "@/lib/utils/format";
import { getApiErrorMessage } from "@/lib/utils/helpers";
import { useUserStore } from "@/store/user-store";
import type { ProjectFormValues } from "@/lib/validators/project";

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.currentUser);
  const [editOpen, setEditOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => projectsApi.getById(projectId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      projectsApi.update(projectId, {
        title: values.title,
        description: values.description,
        deadline: values.deadline || undefined,
        status: values.status,
        required_skill_ids: values.required_skill_ids,
      }),
    onSuccess: () => {
      toast.success("Project updated.");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "We could not update the project."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      toast.success("Project deleted.");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(routes.projects);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "We could not delete the project."));
    },
  });

  if (projectQuery.isError) {
    return (
      <section className="container py-10 md:py-14">
        <EmptyState
          title="Project not found"
          description="This project may have been removed or the link is no longer valid."
          action={
            <Button asChild>
              <Link href={routes.projects}>Back to projects</Link>
            </Button>
          }
        />
      </section>
    );
  }

  const project = projectQuery.data;
  const isOwner = Boolean(currentUser && project && currentUser.id === project.owner_id);

  return (
    <section className="container py-10 md:py-14">
      <div className="space-y-8">
        <Button asChild variant="ghost" className="px-0">
          <Link href={routes.projects}>
            <ArrowLeft />
            Back to projects
          </Link>
        </Button>

        {project ? (
          <>
            <PageIntro
              eyebrow="Project details"
              title={project.title}
              description={project.description}
              actions={
                isOwner ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">
                          <Pencil />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit project</DialogTitle>
                          <DialogDescription>
                            Update the brief, current status, deadline or required skills.
                          </DialogDescription>
                        </DialogHeader>
                        <ProjectForm
                          initialValues={{
                            title: project.title,
                            description: project.description,
                            deadline: project.deadline?.slice(0, 10) ?? "",
                            status: project.status,
                            required_skill_ids: project.required_skills.map((skill) => skill.id),
                          }}
                          isSubmitting={updateMutation.isPending}
                          submitLabel="Save changes"
                          onSubmit={(values) => updateMutation.mutate(values)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm("Delete this project permanently?")) {
                          deleteMutation.mutate();
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" disabled>
                    Join requests arrive in the next API module
                  </Button>
                )
              }
            />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Required stack</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {project.required_skills.length ? (
                      project.required_skills.map((skill) => (
                        <Badge key={skill.id} variant="outline">
                          {skill.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">No skills defined yet</Badge>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <MessageSquareText className="h-5 w-5 text-teal-600" />
                      Project chat preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
                    <p>
                      Realtime chat is scheduled for the week 4 WebSocket slice. This frontend already reserves the
                      collaboration area so the project page structure is ready.
                    </p>
                    <div className="rounded-[24px] bg-slate-50/80 p-4">
                      <p className="font-medium text-slate-900">Expected flow</p>
                      <p className="mt-2">
                        Team members will discuss tasks, share updates and receive instant messages without leaving the
                        project page.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Project snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{project.status}</Badge>
                      <Badge variant="secondary">{formatRelativeDate(project.created_at)}</Badge>
                    </div>
                    <div className="space-y-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        Deadline: {formatDate(project.deadline)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        Current participants: {project.participants_count}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Team lead</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                    <p className="font-medium text-slate-900">{project.owner.full_name}</p>
                    <p>{project.owner.university || "University is not specified yet."}</p>
                    <p>{project.owner.bio || "No short owner bio yet."}</p>
                    <Button asChild variant="secondary">
                      <Link href={`/users/${project.owner.id}`}>Open public profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-slate-500">Loading project details...</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
