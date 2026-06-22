import { z } from "zod";

import { projectDirections } from "@/constants/project-directions";

const directionValues = projectDirections.map((direction) => direction.value) as [
  (typeof projectDirections)[number]["value"],
  ...(typeof projectDirections)[number]["value"][],
];

export const projectSchema = z.object({
  title: z.string().trim().min(3, "Название слишком короткое").max(160),
  description: z.string().trim().min(10, "Добавьте больше контекста по проекту").max(5000),
  deadline: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "open", "closed", "archived"]),
  direction: z.enum(directionValues),
  team_size: z.coerce.number().int().min(1, "Минимум 1 участник").max(12, "Максимум 12 участников"),
  required_roles: z.array(z.string().trim().min(2).max(80)).max(12),
  required_skill_ids: z.array(z.string().uuid()).max(20),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
