"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { ProjectForm } from "@/components/forms/project-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { queryKeys } from "@/constants/query-keys";
import { projectsApi } from "@/lib/api/projects";
import { getApiErrorMessage } from "@/lib/utils/helpers";
import type { ProjectFormValues } from "@/lib/validators/project";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      projectsApi.create({
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
      toast.success("Проект создан.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось создать проект."));
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Создать проект
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый проект</DialogTitle>
          <DialogDescription>
            Добавь идею, статус, дедлайн и нужные навыки, чтобы подходящие тиммейты быстрее тебя нашли.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          onSubmit={(values) => createMutation.mutate(values)}
          isSubmitting={createMutation.isPending}
          submitLabel="Опубликовать проект"
        />
      </DialogContent>
    </Dialog>
  );
}
