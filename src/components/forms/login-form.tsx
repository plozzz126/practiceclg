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
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      setSession(response.tokens);
      setCurrentUser(response.user);
      toast.success("С возвращением в DevLink.");
      router.push(routes.dashboard);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось войти в аккаунт."));
    },
  });

  const onSubmit = form.handleSubmit((values) => loginMutation.mutate(values));

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Вход</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Продолжай работу с проектами, сохраненным профилем и поиском команды.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
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

          <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Входим..." : "Войти"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Еще нет аккаунта?{" "}
            <Link className="font-medium text-tone-primary hover:opacity-80" href={routes.register}>
              Создать
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
