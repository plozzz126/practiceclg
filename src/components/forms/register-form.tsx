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
      toast.success("Your account is ready. Let's finish the profile.");
      router.push(routes.profile);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "We could not create the account."));
    },
  });

  const onSubmit = form.handleSubmit((values) => registerMutation.mutate(values));

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Create account</CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          Start with your name, email and password. Skills and profile details can be added right after sign up.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" placeholder="Aruzhan Sarsen" {...form.register("full_name")} />
            <FormError message={form.formState.errors.full_name?.message} />
          </div>

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

          <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Already registered?{" "}
            <Link className="font-medium text-teal-700 hover:text-teal-800" href={routes.login}>
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
