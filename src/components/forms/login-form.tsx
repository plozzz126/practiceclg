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
      toast.success("Welcome back to EduMatch.");
      router.push(routes.dashboard);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "We could not sign you in."));
    },
  });

  const onSubmit = form.handleSubmit((values) => loginMutation.mutate(values));

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Log in</CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          Continue to your dashboard, saved profile and active project search.
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
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Minimum 8 characters" {...form.register("password")} />
            <FormError message={form.formState.errors.password?.message} />
          </div>

          <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          <p className="text-center text-sm text-slate-500">
            No account yet?{" "}
            <Link className="font-medium text-teal-700 hover:text-teal-800" href={routes.register}>
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
