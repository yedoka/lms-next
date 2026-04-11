"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema } from "@/lib/validation/signup";
import z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type SignupInput = z.infer<typeof SignupSchema>;

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      role: undefined,
      password: "",
      passwordConfirmation: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: SignupInput) => {
    try {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!signupRes.ok) {
        const body = (await signupRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(body?.error ?? "Signup request failed");
        return;
      }

      const signInRes = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInRes?.ok) {
        toast.success("Account created. Welcome!");
        reset();
        router.push("/");
        router.refresh();
        return;
      }

      toast.success("Account created. Please login.");
      reset();
      router.push("/auth/login");
    } catch {
      toast.error("Network error during login");
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input {...register("name")} />
              {errors.name && (
                <FieldDescription className="text-destructive">
                  {errors.name.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input {...register("email")} />
              {errors.email && (
                <FieldDescription className="text-destructive">
                  {errors.email.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel>I am signing up as</FieldLabel>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value="STUDENT" {...register("role")} />
                  Student
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value="TEACHER" {...register("role")} />
                  Teacher
                </label>
              </div>
              {errors.role && (
                <FieldDescription className="text-destructive">
                  {errors.role.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input {...register("password")} type="password" />
              {errors.password ? (
                <FieldDescription className="text-destructive">
                  {errors.password.message}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  Must be at least 8 characters and include one number.
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="passwordConfirmation">
                Confirm Password
              </FieldLabel>
              <Input
                {...register("passwordConfirmation")}
                type="password"
                required
              />
              {errors.passwordConfirmation ? (
                <FieldDescription className="text-destructive">
                  {errors.passwordConfirmation.message}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  Please confirm your password.
                </FieldDescription>
              )}
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  Create Account
                </Button>
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link href="/auth/login">Login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
