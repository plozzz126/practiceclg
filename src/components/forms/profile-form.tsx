"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SkillPicker } from "@/components/forms/skill-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSkillsCatalog } from "@/lib/hooks/use-skills-catalog";
import { usersApi } from "@/lib/api/users";
import { getApiErrorMessage } from "@/lib/utils/helpers";
import { profileSchema, type ProfileFormValues } from "@/lib/validators/user";
import { useUserStore } from "@/store/user-store";
import type { CurrentUser } from "@/types/user";

function toDefaultValues(user: CurrentUser): ProfileFormValues {
  return {
    full_name: user.full_name,
    university: user.university ?? "",
    course: user.course ?? undefined,
    bio: user.bio ?? "",
    avatar_url: user.avatar_url ?? "",
    skill_ids: user.skills.map((skill) => skill.id),
  };
}

export function ProfileForm({ currentUser }: { currentUser: CurrentUser }) {
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const { skills, isLoading: skillsLoading } = useSkillsCatalog();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toDefaultValues(currentUser),
  });

  useEffect(() => {
    form.reset(toDefaultValues(currentUser));
  }, [currentUser, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      await usersApi.updateMe({
        full_name: values.full_name,
        university: values.university || undefined,
        course: values.course,
        bio: values.bio || undefined,
        avatar_url: values.avatar_url || undefined,
      });

      return usersApi.updateMySkills({
        skill_ids: values.skill_ids,
      });
    },
    onSuccess: (response) => {
      setCurrentUser(response);
      toast.success("Профиль обновлен.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось сохранить профиль."));
    },
  });

  const selectedSkillIds = form.watch("skill_ids");
  const onSubmit = form.handleSubmit((values) => updateMutation.mutate(values));

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Профиль</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Навыки, короткое био и данные об учебе влияют на рекомендации по проектам и тиммейтам.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="full_name">Полное имя</Label>
              <Input id="full_name" {...form.register("full_name")} />
              <FormError message={form.formState.errors.full_name?.message} />
            </div>

            <div>
              <Label htmlFor="avatar_url">Ссылка на аватар</Label>
              <Input id="avatar_url" placeholder="https://..." {...form.register("avatar_url")} />
              <FormError message={form.formState.errors.avatar_url?.message} />
            </div>

            <div>
              <Label htmlFor="university">Университет</Label>
              <Input id="university" placeholder="Astana IT University" {...form.register("university")} />
              <FormError message={form.formState.errors.university?.message} />
            </div>

            <div>
              <Label htmlFor="course">Курс</Label>
              <Input
                id="course"
                type="number"
                min={1}
                max={8}
                {...form.register("course", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
              />
              <FormError message={form.formState.errors.course?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">О себе</Label>
            <Textarea
              id="bio"
              placeholder="Расскажи, что ты делаешь, изучаешь и какую команду ищешь."
              {...form.register("bio")}
            />
            <FormError message={form.formState.errors.bio?.message} />
          </div>

          <div className="space-y-3">
            <Label>Навыки</Label>
            <div className="rounded-[8px] border border-border bg-muted/60 p-4">
              {skillsLoading && !skills.length ? (
                <p className="text-sm text-muted-foreground">Загружаем каталог навыков...</p>
              ) : (
                <SkillPicker
                  skills={skills}
                  selectedIds={selectedSkillIds}
                  onChange={(nextIds) => form.setValue("skill_ids", nextIds, { shouldValidate: true })}
                />
              )}
            </div>
            <FormError message={form.formState.errors.skill_ids?.message} />
          </div>

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Сохраняем профиль..." : "Сохранить профиль"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
