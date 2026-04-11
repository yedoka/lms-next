import z from "zod";

export const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100)
    .regex(/\d/, "Password must contain at least one number"),
  rememberMe: z.boolean().default(false),
});
