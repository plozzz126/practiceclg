"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { SkillPicker } from "@/components/forms/skill-picker";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { projectDirections } from "@/constants/project-directions";
import { projectStatusOptions } from "@/constants/project-status";
import { useSkillsCatalog } from "@/lib/hooks/use-skills-catalog";
import { projectSchema, type ProjectFormValues } from "@/lib/validators/project";

const rolePresets = [
  "Frontend",
  "Backend",
  "Full-stack",
  "UI/UX дизайнер",
  "Продакт-менеджер",
  "Дата-сайентист",
  "ML-инженер",
  "DevOps",
  "Кибербезопасность",
  "CTF",
  "QA-инженер",
  "Исследователь",
];

export function ProjectForm({
  onSubmit,
  isSubmitting = false,
  submitLabel = "Сохранить проект",
  initialValues,
}: {
  onSubmit: (values: ProjectFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  initialValues?: Partial<ProjectFormValues>;
}) {
  const { skills, isLoading } = useSkillsCatalog();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      deadline: initialValues?.deadline ?? "",
      status: initialValues?.status ?? "open",
      direction: initialValues?.direction ?? "web",
      team_size: initialValues?.team_size ?? 4,
      required_roles: initialValues?.required_roles ?? [],
      required_skill_ids: initialValues?.required_skill_ids ?? [],
    },
  });

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    form.reset({
      title: initialValues.title ?? "",
      description: initialValues.description ?? "",
      deadline: initialValues.deadline ?? "",
      status: initialValues.status ?? "open",
      direction: initialValues.direction ?? "web",
      team_size: initialValues.team_size ?? 4,
      required_roles: initialValues.required_roles ?? [],
      required_skill_ids: initialValues.required_skill_ids ?? [],
    });
  }, [form, initialValues]);

  const selectedSkillIds = form.watch("required_skill_ids");
  const selectedRoles = form.watch("required_roles");

  const toggleRole = (role: string) => {
    const nextRoles = selectedRoles.includes(role)
      ? selectedRoles.filter((item) => item !== role)
      : [...selectedRoles, role];

    form.setValue("required_roles", nextRoles, { shouldValidate: true });
  };

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="title">Название проекта</Label>
        <Input id="title" placeholder="Команда на хакатон для campus-сервиса" {...form.register("title")} />
        <FormError message={form.formState.errors.title?.message} />
      </div>

      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          placeholder="Опиши идею, цель, ожидаемую загрузку и какую помощь ищешь от команды."
          {...form.register("description")}
        />
        <FormError message={form.formState.errors.description?.message} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Направление</Label>
          <Select
            value={form.watch("direction")}
            onValueChange={(value: ProjectFormValues["direction"]) =>
              form.setValue("direction", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите направление" />
            </SelectTrigger>
            <SelectContent>
              {projectDirections.map((direction) => (
                <SelectItem key={direction.value} value={direction.value}>
                  {direction.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={form.formState.errors.direction?.message} />
        </div>

        <div>
          <Label htmlFor="deadline">Дедлайн</Label>
          <Input id="deadline" type="date" {...form.register("deadline")} />
          <FormError message={form.formState.errors.deadline?.message} />
        </div>

        <div className="space-y-2">
          <Label>Статус</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value: ProjectFormValues["status"]) =>
              form.setValue("status", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите статус" />
            </SelectTrigger>
            <SelectContent>
              {projectStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={form.formState.errors.status?.message} />
        </div>

        <div>
          <Label htmlFor="team_size">Размер команды</Label>
          <Input
            id="team_size"
            type="number"
            min={1}
            max={12}
            {...form.register("team_size", { valueAsNumber: true })}
          />
          <FormError message={form.formState.errors.team_size?.message} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Нужные роли</Label>
        <div className="flex flex-wrap gap-2">
          {rolePresets.map((role) => {
            const selected = selectedRoles.includes(role);

            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={
                  selected
                    ? "rounded-full border border-teal-500 bg-teal-500 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-teal-400 hover:text-foreground"
                }
              >
                {role}
              </button>
            );
          })}
        </div>
        <FormError message={form.formState.errors.required_roles?.message} />
      </div>

      <div className="space-y-3">
        <Label>Требуемые навыки</Label>
        <div className="rounded-[8px] border border-border bg-muted/60 p-4">
          {isLoading && !skills.length ? (
            <p className="text-sm text-muted-foreground">Загружаем каталог навыков...</p>
          ) : (
            <SkillPicker
              skills={skills}
              selectedIds={selectedSkillIds}
              onChange={(nextIds) =>
                form.setValue("required_skill_ids", nextIds, {
                  shouldValidate: true,
                })
              }
            />
          )}
        </div>
        <FormError message={form.formState.errors.required_skill_ids?.message} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Сохраняем..." : submitLabel}
      </Button>
    </form>
  );
}
