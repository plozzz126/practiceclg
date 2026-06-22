import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Введите корректный email"),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов").max(72),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Имя слишком короткое").max(160),
  email: z.string().trim().email("Введите корректный email").max(255),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов").max(72),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
