import { z } from "zod";
import { SIGNUP_ROLES } from "@/lib/auth/roles";

export const SignupSchema = z
  .object({
    name: z.string().min(4, "Name must be at least 4 characters long"),
    email: z.email("Invalid email address"),
    role: z.enum(SIGNUP_ROLES),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/\d/, "Password must contain at least one number"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Passwords do not match",
  });
