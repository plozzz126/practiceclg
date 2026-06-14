import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(160),
  description: z.string().trim().min(10, "Add more context to the project").max(5000),
  deadline: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "open", "closed", "archived"]),
  required_skill_ids: z.array(z.string().uuid()).max(20),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
