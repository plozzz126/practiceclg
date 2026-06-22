"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/constants/routes";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/utils/helpers";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      await authApi.register(values);
      return authApi.login({
        email: values.email,
        password: values.password,
      });
    },
    onSuccess: (response) => {
      setSession(response.tokens);
      setCurrentUser(response.user);
      toast.success("Аккаунт создан. Давай заполним профиль.");
      router.push(routes.profile);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось создать аккаунт."));
    },
  });

  const onSubmit = form.handleSubmit((values) => registerMutation.mutate(values));

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Регистрация</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Начни с имени, почты и пароля. Навыки и детали профиля можно добавить сразу после регистрации.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="full_name">Полное имя</Label>
            <Input id="full_name" placeholder="Аружан Сарсен" {...form.register("full_name")} />
            <FormError message={form.formState.errors.full_name?.message} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="student@university.edu" {...form.register("email")} />
            <FormError message={form.formState.errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" type="password" placeholder="Минимум 8 символов" {...form.register("password")} />
            <FormError message={form.formState.errors.password?.message} />
          </div>

          <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Создаем аккаунт..." : "Создать аккаунт"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link className="font-medium text-tone-primary hover:opacity-80" href={routes.login}>
              Войти
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
