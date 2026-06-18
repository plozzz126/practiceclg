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
import { projectStatusOptions } from "@/constants/project-status";
import { useSkillsCatalog } from "@/lib/hooks/use-skills-catalog";
import { projectSchema, type ProjectFormValues } from "@/lib/validators/project";

export function ProjectForm({
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save project",
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
      required_skill_ids: initialValues.required_skill_ids ?? [],
    });
  }, [form, initialValues]);

  const selectedSkillIds = form.watch("required_skill_ids");

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="title">Project title</Label>
        <Input id="title" placeholder="Hackathon team for campus product" {...form.register("title")} />
        <FormError message={form.formState.errors.title?.message} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Explain the idea, goals, expected commitment and what help is needed."
          {...form.register("description")}
        />
        <FormError message={form.formState.errors.description?.message} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" {...form.register("deadline")} />
          <FormError message={form.formState.errors.deadline?.message} />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value: ProjectFormValues["status"]) =>
              form.setValue("status", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
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
      </div>

      <div className="space-y-3">
        <Label>Required skills</Label>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
          {isLoading && !skills.length ? (
            <p className="text-sm text-slate-500">Loading skills catalog...</p>
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
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
