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
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/auth/routes";
import { ROLE } from "@/lib/auth/roles";
import {
  autoSignInAfterSignup,
  submitSignup,
} from "@/lib/auth/client-actions";

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
    const signupResult = await submitSignup(data);

    if (!signupResult.ok) {
      toast.error(signupResult.message);
      return;
    }

    const signInResult = await autoSignInAfterSignup(data.email, data.password);

    if (signInResult.ok) {
      toast.success("Account created. Welcome!");
      reset();
      router.push(ROUTES.HOME);
      router.refresh();
      return;
    }

    toast.success(signInResult.message);
    reset();
    router.push(ROUTES.AUTH_LOGIN);
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
                  <input type="radio" value={ROLE.STUDENT} {...register("role")} />
                  Student
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value={ROLE.TEACHER} {...register("role")} />
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
                  Already have an account? <Link href={ROUTES.AUTH_LOGIN}>Login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
