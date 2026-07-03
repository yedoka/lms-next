import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(100, "Password is too long"),
  rememberMe: z.boolean().default(false),
});
