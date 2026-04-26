"use server";

import prisma from "@/lib/prisma";
import { SignupSchema } from "@/lib/validation/signup";
import argon2 from "argon2";
import type { ActionResult, SignupActionInput } from "@/lib/auth/client-actions";

export const executeSignup = async (
  input: SignupActionInput
): Promise<ActionResult> => {
  try {
    const data = SignupSchema.safeParse(input);
    if (!data.success) {
      const message = data.error.issues[0]?.message ?? "Invalid input data";
      return { ok: false, message };
    }

    const { email, name, password, role } = data.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return { ok: false, message: "User already exists" };
    }

    const hashedPassword = await argon2.hash(password);

    await prisma.user.create({
      data: { email, name, password: hashedPassword, role },
    });

    return { ok: true };
  } catch (error) {
    console.error("[SIGNUP_ERROR]", error);
    return { ok: false, message: "Internal server error during signup" };
  }
};
