"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SkillPicker } from "@/components/forms/skill-picker";
import { UserCard } from "@/components/user/user-card";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/constants/query-keys";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useSkillsCatalog } from "@/lib/hooks/use-skills-catalog";
import { projectsApi } from "@/lib/api/projects";
import { getApiErrorMessage } from "@/lib/utils/helpers";

export function ProjectInviteDialog({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { skills } = useSkillsCatalog();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [course, setCourse] = useState("");
  const [university, setUniversity] = useState("");
  const [rating, setRating] = useState("0");
  const [message, setMessage] = useState("");

  const debouncedQuery = useDebouncedValue(query);
  const debouncedUniversity = useDebouncedValue(university);
  const skillsParam = selectedSkillIds.join(",");

  const params = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      skills: skillsParam || undefined,
      course: course ? Number(course) : undefined,
      university: debouncedUniversity || undefined,
      rating: Number(rating) > 0 ? Number(rating) : undefined,
    }),
    [course, debouncedQuery, debouncedUniversity, rating, skillsParam],
  );

  const candidatesQuery = useQuery({
    queryKey: queryKeys.projectInviteCandidates(projectId, params),
    queryFn: () => projectsApi.listInviteCandidates(projectId, params),
    enabled: open,
  });

  const inviteMutation = useMutation({
    mutationFn: (recipientId: string) =>
      projectsApi.createInvitation(projectId, {
        recipient_id: recipientId,
        message: message.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Приглашение отправлено.");
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "invite-candidates"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectInvitations(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      setMessage("");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось отправить приглашение."));
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Пригласить участника</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Приглашение в проект</DialogTitle>
          <DialogDescription>
            Найди человека по нику, навыкам, курсу, университету и рейтингу. В поиск попадают только те, кто разрешил
            приглашения в своих настройках.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <Label htmlFor="invite-query">Поиск по нику</Label>
              <Input
                id="invite-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Аружан, Данияр, Алина..."
              />
            </div>
            <div>
              <Label htmlFor="invite-course">Курс</Label>
              <Input
                id="invite-course"
                type="number"
                min={1}
                max={8}
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                placeholder="1-8"
              />
            </div>
            <div>
              <Label htmlFor="invite-rating">Мин. рейтинг</Label>
              <Input
                id="invite-rating"
                type="number"
                min={0}
                max={5}
                step="0.5"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="invite-university">Университет</Label>
            <Input
              id="invite-university"
              value={university}
              onChange={(event) => setUniversity(event.target.value)}
              placeholder="Поиск по университету"
            />
          </div>

          <div className="space-y-3">
            <Label>Навыки</Label>
            <div className="rounded-[8px] border border-border bg-muted/60 p-4">
              <SkillPicker skills={skills} selectedIds={selectedSkillIds} onChange={setSelectedSkillIds} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">Сообщение к приглашению</Label>
            <Textarea
              id="invite-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Например: Нам нужен сильный frontend на страницу кабинета и взаимодействие с API."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setSelectedSkillIds([]);
                setCourse("");
                setUniversity("");
                setRating("0");
              }}
            >
              Сбросить фильтры
            </Button>
            <p className="self-center text-sm text-muted-foreground">
              Найдено кандидатов: {candidatesQuery.data?.items.length ?? 0}
            </p>
          </div>

          {candidatesQuery.data?.items.length ? (
            <div className="grid max-h-[420px] gap-4 overflow-y-auto pr-1 xl:grid-cols-2">
              {candidatesQuery.data.items.map((candidate) => (
                <UserCard
                  key={candidate.id}
                  user={candidate}
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => inviteMutation.mutate(candidate.id)}
                      disabled={inviteMutation.isPending}
                    >
                      Отправить приглашение
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="min-h-52"
              title="Кандидаты не найдены"
              description="Попробуй ослабить фильтры или убрать часть навыков, если сейчас никто не подходит."
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
