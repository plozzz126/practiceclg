import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is too short").max(160),
  university: z.string().trim().max(180).optional().or(z.literal("")),
  course: z.coerce.number().int().min(1).max(8).optional(),
  bio: z.string().trim().max(1200).optional().or(z.literal("")),
  avatar_url: z.string().trim().url("Avatar URL must be valid").max(1000).optional().or(z.literal("")),
  skill_ids: z.array(z.string().uuid()).max(20),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
