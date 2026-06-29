"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  MessageSquareText,
  ExternalLink,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Target,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProjectForm } from "@/components/forms/project-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getProjectDirectionLabel } from "@/constants/project-directions";
import { queryKeys } from "@/constants/query-keys";
import { routes } from "@/constants/routes";
import { getProjectStatusLabel } from "@/constants/project-status";
import { projectsApi } from "@/lib/api/projects";
import { formatDate, formatRating, formatRelativeDate } from "@/lib/utils/format";
import { getApiErrorMessage, getInitials } from "@/lib/utils/helpers";
import { useUserStore } from "@/store/user-store";
import type { ProjectFormValues } from "@/lib/validators/project";
import type { ProjectJoinRequest, ProjectTask } from "@/types/project";
import { ProjectInviteDialog } from "@/features/projects/components/project-invite-dialog";

function getDecisionLabel(decision: "pending" | "accepted" | "rejected") {
  if (decision === "accepted") {
    return "Принят";
  }

  if (decision === "rejected") {
    return "Отклонен";
  }

  return "На рассмотрении";
}

function getRequestMatchScore(request: ProjectJoinRequest, projectSkillIds: string[]) {
  if (!projectSkillIds.length) {
    return 72;
  }

  const applicantSkillIds = request.user.skills.map((skill) => skill.id);
  const overlap = projectSkillIds.filter((skillId) => applicantSkillIds.includes(skillId)).length;
  return Math.max(48, Math.round((overlap / projectSkillIds.length) * 100));
}

const emptyTaskForm = {
  title: "",
  description: "",
  due_date: "",
};

const emptyDocumentForm = {
  title: "",
  url: "",
  description: "",
};

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.currentUser);
  const [editOpen, setEditOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createDocumentOpen, setCreateDocumentOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [taskEditForm, setTaskEditForm] = useState(emptyTaskForm);
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm);

  const projectQuery = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => projectsApi.getById(projectId),
  });

  const project = projectQuery.data;
  const isOwner = Boolean(currentUser && project && currentUser.id === project.owner_id);

  const tasksQuery = useQuery({
    queryKey: queryKeys.projectTasks(projectId),
    queryFn: () => projectsApi.listTasks(projectId),
  });

  const documentsQuery = useQuery({
    queryKey: queryKeys.projectDocuments(projectId),
    queryFn: () => projectsApi.listDocuments(projectId),
  });

  const myJoinRequestQuery = useQuery({
    queryKey: queryKeys.projectMyJoinRequest(projectId),
    queryFn: () => projectsApi.getMyJoinRequest(projectId),
    enabled: Boolean(currentUser && project && !isOwner),
    refetchInterval: 5000,
  });

  const joinRequestsQuery = useQuery({
    queryKey: queryKeys.projectJoinRequests(projectId),
    queryFn: () => projectsApi.listJoinRequests(projectId),
    enabled: isOwner,
    refetchInterval: 5000,
  });

  const participatingProjectsQuery = useQuery({
    queryKey: queryKeys.participatingProjects,
    queryFn: () => projectsApi.listParticipating(),
    enabled: Boolean(currentUser && !isOwner),
    refetchInterval: 5000,
  });

  const projectInvitationsQuery = useQuery({
    queryKey: queryKeys.projectInvitations(projectId),
    queryFn: () => projectsApi.listProjectInvitations(projectId),
    enabled: isOwner,
    refetchInterval: 5000,
  });

  const isParticipant = Boolean(
    currentUser &&
      (isOwner ||
        myJoinRequestQuery.data?.status === "accepted" ||
        (participatingProjectsQuery.data?.items ?? []).some((item) => item.id === projectId)),
  );

  const hasChatAccess = Boolean(currentUser && isParticipant);

  const messagesQuery = useQuery({
    queryKey: queryKeys.projectMessages(projectId),
    queryFn: () => projectsApi.listMessages(projectId),
    enabled: hasChatAccess,
    refetchInterval: 5000,
  });

  const updateMutation = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      projectsApi.update(projectId, {
        title: values.title,
        description: values.description,
        deadline: values.deadline || undefined,
        status: values.status,
        direction: values.direction,
        team_size: values.team_size,
        required_roles: values.required_roles,
        required_skill_ids: values.required_skill_ids,
      }),
    onSuccess: () => {
      toast.success("Проект обновлен.");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось обновить проект."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      toast.success("Проект удален.");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(routes.projects);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось удалить проект."));
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: () => projectsApi.createTask(projectId, taskForm),
    onSuccess: () => {
      toast.success("Задача добавлена.");
      setCreateTaskOpen(false);
      setTaskForm(emptyTaskForm);
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось добавить задачу."));
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: () => projectsApi.createDocument(projectId, documentForm),
    onSuccess: () => {
      toast.success("Ссылка на документацию добавлена.");
      setCreateDocumentOpen(false);
      setDocumentForm(emptyDocumentForm);
      queryClient.invalidateQueries({ queryKey: queryKeys.projectDocuments(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось добавить документацию."));
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => projectsApi.deleteDocument(projectId, documentId),
    onSuccess: () => {
      toast.success("Документ удален.");
      queryClient.invalidateQueries({ queryKey: queryKeys.projectDocuments(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось удалить документ."));
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Partial<typeof emptyTaskForm> & { done?: boolean } }) =>
      projectsApi.updateTask(projectId, taskId, payload),
    onSuccess: () => {
      toast.success("Задача обновлена.");
      setEditingTask(null);
      setTaskEditForm(emptyTaskForm);
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось обновить задачу."));
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => projectsApi.deleteTask(projectId, taskId),
    onSuccess: () => {
      toast.success("Задача удалена.");
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось удалить задачу."));
    },
  });

  const submitJoinRequestMutation = useMutation({
    mutationFn: () => projectsApi.submitJoinRequest(projectId, { message: joinMessage.trim() || undefined }),
    onSuccess: () => {
      toast.success("Заявка отправлена лидеру проекта.");
      setJoinOpen(false);
      setJoinMessage("");
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMyJoinRequest(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось отправить заявку."));
    },
  });

  const reviewJoinRequestMutation = useMutation({
    mutationFn: ({ requestId, decision }: { requestId: string; decision: "accepted" | "rejected" }) =>
      projectsApi.reviewJoinRequest(projectId, requestId, { decision }),
    onSuccess: (_, variables) => {
      toast.success(variables.decision === "accepted" ? "Кандидат принят в команду." : "Заявка отклонена.");
      queryClient.invalidateQueries({ queryKey: queryKeys.projectJoinRequests(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось обработать заявку."));
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: () => projectsApi.createMessage(projectId, { body: chatInput.trim() }),
    onSuccess: () => {
      setChatInput("");
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMessages(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось отправить сообщение."));
    },
  });

  const matchScore = useMemo(() => {
    if (!currentUser || !project?.required_skills.length) {
      return 72;
    }

    const userSkillIds = currentUser.skills.map((skill) => skill.id);
    const overlap = project.required_skills.filter((skill) => userSkillIds.includes(skill.id)).length;
    return Math.max(48, Math.round((overlap / project.required_skills.length) * 100));
  }, [currentUser, project]);

  const tasks = tasksQuery.data?.items ?? [];
  const documents = documentsQuery.data?.items ?? [];
  const joinRequests = joinRequestsQuery.data?.items ?? [];
  const projectInvitations = projectInvitationsQuery.data?.items ?? [];
  const myJoinRequest = myJoinRequestQuery.data;
  const messages = messagesQuery.data?.items ?? [];
  const canSubmitJoinRequest = Boolean(
    currentUser && !isOwner && !isParticipant && myJoinRequest?.status !== "pending" && myJoinRequest?.status !== "accepted",
  );

  const openEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setTaskEditForm({
      title: task.title,
      description: task.description ?? "",
      due_date: task.due_date ?? "",
    });
  };

  const handleSendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    sendMessageMutation.mutate();
  };

  if (projectQuery.isError) {
    return (
      <section className="container py-10 md:py-14">
        <EmptyState
          title="Проект не найден"
          description="Возможно, проект был удален или ссылка больше неактуальна."
          action={
            <Button asChild>
              <Link href={routes.projects}>Назад к проектам</Link>
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section className="container py-8 md:py-12">
      <div className="space-y-7">
        <Button asChild variant="ghost" className="px-0">
          <Link href={routes.projects}>
            <ArrowLeft />
            Назад к проектам
          </Link>
        </Button>

        {project ? (
          <>
            <PageIntro
              eyebrow={getProjectDirectionLabel(project.direction)}
              title={project.title}
              description={project.description}
              actions={
                isOwner ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <ProjectInviteDialog projectId={projectId} />
                    <Dialog open={createDocumentOpen} onOpenChange={setCreateDocumentOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">
                          <FileText />
                          Документация
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить ссылку на документацию</DialogTitle>
                          <DialogDescription>
                            Быстрый вариант: добавь Google Drive, Notion, GitHub, Figma или любой публичный документ с ТЗ.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <Input
                            value={documentForm.title}
                            onChange={(event) =>
                              setDocumentForm((current) => ({ ...current, title: event.target.value }))
                            }
                            placeholder="Например: ТЗ проекта"
                          />
                          <Input
                            value={documentForm.url}
                            onChange={(event) =>
                              setDocumentForm((current) => ({ ...current, url: event.target.value }))
                            }
                            placeholder="https://drive.google.com/..."
                          />
                          <Textarea
                            value={documentForm.description}
                            onChange={(event) =>
                              setDocumentForm((current) => ({ ...current, description: event.target.value }))
                            }
                            placeholder="Коротко: что внутри и для кого эта ссылка."
                          />
                          <Button onClick={() => createDocumentMutation.mutate()} disabled={createDocumentMutation.isPending}>
                            Сохранить ссылку
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus />
                          Добавить задачу
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Новая задача</DialogTitle>
                          <DialogDescription>Задача сохранится в базе и будет видна всей команде.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <Input
                            value={taskForm.title}
                            onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                            placeholder="Например: Подготовить прототип"
                          />
                          <Textarea
                            value={taskForm.description}
                            onChange={(event) =>
                              setTaskForm((current) => ({ ...current, description: event.target.value }))
                            }
                            placeholder="Коротко опиши ожидаемый результат."
                          />
                          <Input
                            type="date"
                            value={taskForm.due_date}
                            onChange={(event) => setTaskForm((current) => ({ ...current, due_date: event.target.value }))}
                          />
                          <Button onClick={() => createTaskMutation.mutate()} disabled={createTaskMutation.isPending}>
                            Создать задачу
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">
                          <Pencil />
                          Редактировать проект
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Редактирование проекта</DialogTitle>
                          <DialogDescription>
                            Обнови направление, дедлайн, роли, стек и размер команды.
                          </DialogDescription>
                        </DialogHeader>
                        <ProjectForm
                          initialValues={{
                            title: project.title,
                            description: project.description,
                            deadline: project.deadline?.slice(0, 10) ?? "",
                            status: project.status,
                            direction: project.direction,
                            team_size: project.team_size,
                            required_roles: project.required_roles,
                            required_skill_ids: project.required_skills.map((skill) => skill.id),
                          }}
                          isSubmitting={updateMutation.isPending}
                          submitLabel="Сохранить изменения"
                          onSubmit={(values) => updateMutation.mutate(values)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm("Удалить проект безвозвратно?")) {
                          deleteMutation.mutate();
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 />
                      Удалить
                    </Button>
                  </div>
                ) : (
                    <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                      <DialogTrigger asChild>
                        <Button disabled={!canSubmitJoinRequest}>
                          <UserCheck />
                          {currentUser
                            ? isParticipant
                              ? "Вы уже в команде"
                              : "Подать заявку"
                            : "Войдите, чтобы откликнуться"}
                        </Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Заявка в проект</DialogTitle>
                        <DialogDescription>
                          Лид проекта увидит твой профиль, навыки, рейтинг и мотивационное сообщение.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="rounded-[8px] border border-border bg-muted/60 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Совпадение профиля</p>
                              <p className="mt-1 font-display text-3xl font-semibold text-foreground">{matchScore}%</p>
                            </div>
                            <ShieldCheck className="h-10 w-10 text-tone-primary" />
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {(currentUser?.skills ?? []).slice(0, 6).map((skill) => (
                              <Badge key={skill.id} variant="outline">
                                {skill.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          value={joinMessage}
                          onChange={(event) => setJoinMessage(event.target.value)}
                          placeholder="Напиши, какую роль можешь закрыть и почему подходишь этой команде."
                        />
                        <Button
                          onClick={() => submitJoinRequestMutation.mutate()}
                          disabled={submitJoinRequestMutation.isPending || !canSubmitJoinRequest}
                        >
                          Отправить заявку
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              }
            />

            <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редактирование задачи</DialogTitle>
                  <DialogDescription>Изменения сохранятся для всех участников проекта.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <Input
                    value={taskEditForm.title}
                    onChange={(event) => setTaskEditForm((current) => ({ ...current, title: event.target.value }))}
                  />
                  <Textarea
                    value={taskEditForm.description}
                    onChange={(event) => setTaskEditForm((current) => ({ ...current, description: event.target.value }))}
                  />
                  <Input
                    type="date"
                    value={taskEditForm.due_date}
                    onChange={(event) => setTaskEditForm((current) => ({ ...current, due_date: event.target.value }))}
                  />
                  <Button
                    onClick={() => {
                      if (!editingTask) {
                        return;
                      }

                      updateTaskMutation.mutate({
                        taskId: editingTask.id,
                        payload: taskEditForm,
                      });
                    }}
                    disabled={updateTaskMutation.isPending}
                  >
                    Сохранить задачу
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Дедлайн проекта</p>
                  <p className="mt-2 flex items-center gap-2 font-semibold text-foreground">
                    <CalendarDays className="h-4 w-4 text-tone-primary" />
                    {formatDate(project.deadline)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Команда</p>
                  <p className="mt-2 flex items-center gap-2 font-semibold text-foreground">
                    <Users className="h-4 w-4 text-tone-primary" />
                    {project.participants_count}/{project.team_size}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Статус</p>
                  <p className="mt-2 font-semibold text-foreground">{getProjectStatusLabel(project.status)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Создан</p>
                  <p className="mt-2 font-semibold text-foreground">{formatRelativeDate(project.created_at)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-tone-primary" />
                      Стек и роли
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Требуемый стек</p>
                      <div className="mt-3 flex flex-wrap gap-2">
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
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Нужные роли</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.required_roles.length ? (
                          project.required_roles.map((role) => <Badge key={role}>{role}</Badge>)
                        ) : (
                          <Badge variant="secondary">Список ролей пока гибкий</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-tone-primary" />
                      Документация
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {documents.length ? (
                      documents.map((document) => (
                        <div key={document.id} className="rounded-[8px] border border-border bg-muted/45 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">{document.title}</p>
                              {document.description ? (
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">{document.description}</p>
                              ) : null}
                              <p className="mt-2 text-xs text-muted-foreground">Добавлено {formatRelativeDate(document.created_at)}</p>
                            </div>
                            <Button asChild size="sm" variant="secondary">
                              <a href={document.url} target="_blank" rel="noreferrer">
                                <ExternalLink />
                                Открыть
                              </a>
                            </Button>
                          </div>
                          {isOwner ? (
                            <div className="mt-4 flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (window.confirm("Удалить ссылку на документ?")) {
                                    deleteDocumentMutation.mutate(document.id);
                                  }
                                }}
                                disabled={deleteDocumentMutation.isPending}
                              >
                                <Trash2 />
                                Удалить
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        className="min-h-48"
                        title="Документация пока не добавлена"
                        description={
                          isOwner
                            ? "Добавь ссылку на ТЗ, диск, Figma или Notion, чтобы команда и кандидаты видели условия проекта."
                            : "Лид проекта еще не прикрепил ссылки на ТЗ или материалы."
                        }
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-tone-primary" />
                      Задачи и дедлайны
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasks.length ? (
                      tasks.map((task) => (
                        <div key={task.id} className="rounded-[8px] border border-border bg-muted/45 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              {task.done ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-tone-primary" />
                              ) : (
                                <Clock3 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium text-foreground">{task.title}</p>
                                {task.description ? (
                                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{task.description}</p>
                                ) : null}
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {task.due_date ? `До ${formatDate(task.due_date)}` : "Без дедлайна"}
                                </p>
                              </div>
                            </div>
                            <Badge variant={task.done ? "default" : "secondary"}>{task.done ? "Готово" : "В работе"}</Badge>
                          </div>
                          {isOwner ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant={task.done ? "secondary" : "default"}
                                onClick={() => updateTaskMutation.mutate({ taskId: task.id, payload: { done: !task.done } })}
                                disabled={updateTaskMutation.isPending}
                              >
                                <CheckCircle2 />
                                {task.done ? "Вернуть в работу" : "Отметить готовой"}
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => openEditTask(task)}>
                                <Pencil />
                                Изменить
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (window.confirm("Удалить задачу?")) {
                                    deleteTaskMutation.mutate(task.id);
                                  }
                                }}
                                disabled={deleteTaskMutation.isPending}
                              >
                                <Trash2 />
                                Удалить
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        className="min-h-48"
                        title="Задач пока нет"
                        description={isOwner ? "Добавь первую задачу проекта и назначь ей дедлайн." : "Лид проекта еще не добавил план работ."}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquareText className="h-5 w-5 text-tone-primary" />
                      Чат проекта
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasChatAccess ? (
                      <>
                        <div className="grid gap-3">
                          {messages.length ? (
                            messages.map((message) => (
                              <div
                                key={message.id}
                                className={message.sender_id === currentUser?.id ? "flex justify-end" : "flex justify-start"}
                              >
                                <div
                                  className={
                                    message.sender_id === currentUser?.id
                                      ? "max-w-[82%] rounded-[8px] bg-teal-500 px-4 py-3 text-sm text-white"
                                      : "max-w-[82%] rounded-[8px] bg-muted px-4 py-3 text-sm text-muted-foreground"
                                  }
                                >
                                  <p className="font-medium">{message.sender.full_name}</p>
                                  <p className="mt-1 leading-6">{message.body}</p>
                                  <p className="mt-2 text-xs opacity-70">{formatRelativeDate(message.created_at)}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <EmptyState
                              className="min-h-48"
                              title="Чат пока пустой"
                              description="Напиши первое сообщение команде, и оно сохранится в проекте."
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={chatInput}
                            onChange={(event) => setChatInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Напишите сообщение команде..."
                          />
                          <Button
                            size="icon"
                            onClick={handleSendMessage}
                            aria-label="Отправить сообщение"
                            disabled={sendMessageMutation.isPending}
                          >
                            <Send />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-[8px] border border-border bg-muted/45 p-4 text-sm leading-6 text-muted-foreground">
                        Чат больше не заполнен демо-сообщениями. Он открывается только после принятия в команду, а до этого
                        здесь ничего не подставляется искусственно.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Лид проекта</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{getInitials(project.owner.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{project.owner.full_name}</p>
                        <p>{project.owner.university || "Университет пока не указан."}</p>
                      </div>
                    </div>
                    <p>{project.owner.bio || "Короткое описание владельца проекта пока не добавлено."}</p>
                    <Button asChild variant="secondary">
                      <Link href={`/users/${project.owner.id}`}>Открыть полный профиль</Link>
                    </Button>
                  </CardContent>
                </Card>

                {isOwner ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-tone-primary" />
                          Отправленные приглашения
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {projectInvitations.length ? (
                          projectInvitations.map((invitation) => (
                            <div key={invitation.id} className="rounded-[8px] border border-border bg-muted/45 p-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback>{getInitials(invitation.recipient.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-foreground">{invitation.recipient.full_name}</p>
                                    <Badge variant="secondary">{getDecisionLabel(invitation.status)}</Badge>
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {invitation.recipient.university || "Университет не указан"} - Курс{" "}
                                    {invitation.recipient.course ?? "не указан"} - Рейтинг {formatRating(invitation.recipient.rating)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {invitation.recipient.skills.map((skill) => (
                                  <Badge key={skill.id} variant="outline">
                                    {skill.name}
                                  </Badge>
                                ))}
                              </div>
                              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                {invitation.message || "Приглашение отправлено без дополнительного комментария."}
                              </p>
                            </div>
                          ))
                        ) : (
                          <EmptyState
                            className="min-h-40"
                            title="Приглашений пока нет"
                            description="Найди кандидатов через поиск и отправь им приглашение прямо из проекта."
                          />
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-tone-primary" />
                          Заявки в команду
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {joinRequests.length ? (
                          joinRequests.map((application) => {
                            const decision = application.status;
                            const match = getRequestMatchScore(
                              application,
                              project.required_skills.map((skill) => skill.id),
                            );

                            return (
                              <div key={application.id} className="rounded-[8px] border border-border bg-muted/45 p-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback>{getInitials(application.user.full_name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-foreground">{application.user.full_name}</p>
                                      <Badge>{match}% совпадение</Badge>
                                      <Badge variant="secondary">{getDecisionLabel(decision)}</Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {application.user.university || "Университет не указан"} - Курс{" "}
                                      {application.user.course ?? "не указан"} - Рейтинг {formatRating(application.user.rating)}
                                    </p>
                                  </div>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                  {application.message || "Пользователь отправил заявку без дополнительного комментария."}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {application.user.skills.map((skill) => (
                                    <Badge key={skill.id} variant="outline">
                                      {skill.name}
                                    </Badge>
                                  ))}
                                </div>
                                {decision === "pending" ? (
                                  <div className="mt-4 flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        reviewJoinRequestMutation.mutate({
                                          requestId: application.id,
                                          decision: "accepted",
                                        })
                                      }
                                      disabled={reviewJoinRequestMutation.isPending}
                                    >
                                      <CheckCircle2 />
                                      Принять
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() =>
                                        reviewJoinRequestMutation.mutate({
                                          requestId: application.id,
                                          decision: "rejected",
                                        })
                                      }
                                      disabled={reviewJoinRequestMutation.isPending}
                                    >
                                      <XCircle />
                                      Отклонить
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        ) : (
                          <EmptyState
                            className="min-h-48"
                            title="Заявок пока нет"
                            description="Когда кто-то подаст реальную заявку, она появится здесь вместо демо-карточек."
                          />
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Статус заявки</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                      {isParticipant ? (
                        <>
                          <p>
                            Статус: <span className="font-medium text-foreground">Вы уже в команде проекта</span>
                          </p>
                          <p>
                            Доступ к чату и рабочему пространству уже открыт. Кнопка подачи заявки скрыта, потому что повторно
                            вступать в этот проект не нужно.
                          </p>
                          <div className="tone-primary-soft rounded-[8px] border p-4">
                            <p className="font-medium">Текущее совпадение: {matchScore}%</p>
                          </div>
                        </>
                      ) : myJoinRequest ? (
                        <>
                          <p>
                            Текущий статус: <span className="font-medium text-foreground">{getDecisionLabel(myJoinRequest.status)}</span>
                          </p>
                          <p>{myJoinRequest.message || "Заявка была отправлена без дополнительного комментария."}</p>
                          <div className="tone-primary-soft rounded-[8px] border p-4">
                            <p className="font-medium">Текущее совпадение: {matchScore}%</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p>Лид оценивает каждую заявку по навыкам, роли, рейтингу, курсу и мотивации.</p>
                          <p>Твой публичный профиль отправляется вместе с заявкой, поэтому навыки и био должны быть актуальными.</p>
                          <div className="tone-primary-soft rounded-[8px] border p-4">
                            <p className="font-medium">Текущее совпадение: {matchScore}%</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Загружаем детали проекта...</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
