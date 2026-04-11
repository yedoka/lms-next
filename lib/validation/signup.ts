import { z } from "zod";

export const SignupSchema = z
  .object({
    name: z.string().min(4, "Name must be at least 4 characters long"),
    email: z.email("Invalid email address"),
    role: z.enum(["STUDENT", "TEACHER"]),
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
