import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must contain at least 8 characters").max(72),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is too short").max(160),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must contain at least 8 characters").max(72),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
