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
  MessageSquareText,
  Pencil,
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

type Decision = "pending" | "accepted" | "rejected";

const demoApplications = [
  {
    id: "aidana",
    name: "Aidana Kim",
    role: "Frontend",
    university: "Astana IT University",
    course: 3,
    rating: 4.8,
    skills: ["React", "TypeScript", "UI/UX", "Figma"],
    message: "Могу взять фронтенд, форму заявки и все состояния интерфейса с нормальной валидацией.",
    match: 92,
  },
  {
    id: "maksim",
    name: "Maksim Orlov",
    role: "Backend",
    university: "SDU University",
    course: 4,
    rating: 4.7,
    skills: ["Go", "PostgreSQL", "Redis", "Docker"],
    message: "Уже работал с REST API, миграциями и деплоем на Railway, могу закрыть backend-часть.",
    match: 88,
  },
  {
    id: "samira",
    name: "Samira Nur",
    role: "Designer",
    university: "KBTU",
    course: 2,
    rating: 4.9,
    skills: ["Figma", "Research", "UI/UX"],
    message: "Соберу flow, dark/light UI kit и мобильные состояния для презентации и разработки.",
    match: 84,
  },
];

const defaultChat = [
  {
    id: "m1",
    author: "Айдана",
    body: "Нужно добить дизайн формы заявки и ошибки на всех шагах.",
    time: "10:12",
    mine: false,
  },
  {
    id: "m2",
    author: "Вы",
    body: "Сегодня подготовлю wireframe, матрицу ролей и список дедлайнов.",
    time: "10:18",
    mine: true,
  },
];

const taskTemplates = [
  { id: "brief", title: "Бриф проекта", dueInDays: 1, done: true },
  { id: "roles", title: "Роли и критерии входа", dueInDays: 2, done: false },
  { id: "wireframe", title: "Прототип для desktop и mobile", dueInDays: 4, done: false },
  { id: "deploy", title: "Чеклист деплоя", dueInDays: 7, done: false },
];

function getTaskDueDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function getDecisionLabel(decision: Decision) {
  if (decision === "accepted") {
    return "Принят";
  }

  if (decision === "rejected") {
    return "Отклонен";
  }

  return "На рассмотрении";
}

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.currentUser);
  const [editOpen, setEditOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState(defaultChat);
  const [completedTasks, setCompletedTasks] = useState<string[]>(
    taskTemplates.filter((task) => task.done).map((task) => task.id),
  );
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

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

  const project = projectQuery.data;
  const isOwner = Boolean(currentUser && project && currentUser.id === project.owner_id);

  const matchScore = useMemo(() => {
    if (!currentUser || !project?.required_skills.length) {
      return 72;
    }

    const userSkillIds = currentUser.skills.map((skill) => skill.id);
    const overlap = project.required_skills.filter((skill) => userSkillIds.includes(skill.id)).length;
    return Math.max(48, Math.round((overlap / project.required_skills.length) * 100));
  }, [currentUser, project]);

  const tasks = taskTemplates.map((task) => ({
    ...task,
    due: getTaskDueDate(task.dueInDays),
    done: completedTasks.includes(task.id),
  }));

  const handleTaskToggle = (taskId: string) => {
    setCompletedTasks((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  };

  const handleSendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    setChatMessages((current) => [
      ...current,
      {
        id: `m-${Date.now()}`,
        author: "Вы",
        body: trimmed,
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        mine: true,
      },
    ]);
    setChatInput("");
  };

  const handleJoinSubmit = () => {
    toast.success("Заявка подготовлена и отправлена лиду проекта.");
    setJoinOpen(false);
    setJoinMessage("");
  };

  const updateDecision = (applicationId: string, decision: Decision) => {
    setDecisions((current) => ({ ...current, [applicationId]: decision }));
    toast.success(decision === "accepted" ? "Кандидат принят в команду." : "Кандидат отклонен.");
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
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">
                          <Pencil />
                          Редактировать
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
                      <Button>
                        <UserCheck />
                        Подать заявку
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
                        <Button onClick={handleJoinSubmit}>Отправить заявку</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              }
            />

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Дедлайн</p>
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
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-tone-primary" />
                      Задачи и дедлайны
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleTaskToggle(task.id)}
                        className="flex w-full items-center justify-between gap-4 rounded-[8px] border border-border bg-muted/45 p-4 text-left transition hover:border-teal-400/40"
                      >
                        <span className="flex items-center gap-3">
                          {task.done ? (
                            <CheckCircle2 className="h-5 w-5 text-tone-primary" />
                          ) : (
                            <Clock3 className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span>
                            <span className="block font-medium text-foreground">{task.title}</span>
                            <span className="text-sm text-muted-foreground">До {formatDate(task.due)}</span>
                          </span>
                        </span>
                        <Badge variant={task.done ? "default" : "secondary"}>{task.done ? "Готово" : "В работе"}</Badge>
                      </button>
                    ))}
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
                    <div className="grid gap-3">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={message.mine ? "flex justify-end" : "flex justify-start"}>
                          <div
                            className={
                              message.mine
                                ? "max-w-[82%] rounded-[8px] bg-teal-500 px-4 py-3 text-sm text-white"
                                : "max-w-[82%] rounded-[8px] bg-muted px-4 py-3 text-sm text-muted-foreground"
                            }
                          >
                            <p className="font-medium">{message.author}</p>
                            <p className="mt-1 leading-6">{message.body}</p>
                            <p className="mt-2 text-xs opacity-70">{message.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleSendMessage();
                          }
                        }}
                        placeholder="Напишите сообщение команде..."
                      />
                      <Button size="icon" onClick={handleSendMessage} aria-label="Отправить сообщение">
                        <Send />
                      </Button>
                    </div>
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-tone-primary" />
                        Заявки в команду
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {demoApplications.map((application) => {
                        const decision = decisions[application.id] ?? "pending";

                        return (
                          <div key={application.id} className="rounded-[8px] border border-border bg-muted/45 p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback>{getInitials(application.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-foreground">{application.name}</p>
                                  <Badge>{application.match}% совпадение</Badge>
                                  <Badge variant="secondary">{getDecisionLabel(decision)}</Badge>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {application.role} - {application.university} - Курс {application.course} - Рейтинг{" "}
                                  {formatRating(application.rating)}
                                </p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{application.message}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {application.skills.map((skill) => (
                                <Badge key={skill} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateDecision(application.id, "accepted")}
                                disabled={decision === "accepted"}
                              >
                                <CheckCircle2 />
                                Принять
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateDecision(application.id, "rejected")}
                                disabled={decision === "rejected"}
                              >
                                <XCircle />
                                Отклонить
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Критерии принятия</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                      <p>Лид оценивает каждую заявку по навыкам, роли, рейтингу, курсу и мотивации.</p>
                      <p>Твой публичный профиль отправляется вместе с заявкой, поэтому навыки и био должны быть актуальными.</p>
                      <div className="tone-primary-soft rounded-[8px] border p-4">
                        <p className="font-medium">Текущее совпадение: {matchScore}%</p>
                      </div>
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
