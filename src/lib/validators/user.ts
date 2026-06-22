import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Имя слишком короткое").max(160),
  university: z.string().trim().max(180).optional().or(z.literal("")),
  course: z.coerce.number().int().min(1, "Курс должен быть от 1 до 8").max(8, "Курс должен быть от 1 до 8").optional(),
  bio: z.string().trim().max(1200, "Описание слишком длинное").optional().or(z.literal("")),
  avatar_url: z.string().trim().url("Ссылка на аватар должна быть корректной").max(1000).optional().or(z.literal("")),
  skill_ids: z.array(z.string().uuid()).max(20),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
