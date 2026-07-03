"use server";

import prisma from "@/shared/db/prisma";
import { SignupSchema } from "@/features/auth/schemas/signup";
import argon2 from "argon2";
import type { ActionResult, SignupActionInput } from "@/features/auth/actions/client-actions";
import { getSettings } from "@/features/admin/services/settings-service";
import { publishAdminEvent } from "@/shared/lib/publish-admin-event";
import { ForgotPasswordSchema, ResetPasswordSchema } from "@/features/auth/schemas/reset-password";
import { createPasswordResetToken, getPasswordResetTokenByToken, deletePasswordResetToken, checkPasswordResetRateLimit } from "@/features/auth/services/password-reset-service";
import { sendPasswordResetEmail } from "@/features/auth/services/email-service";

export const executeSignup = async (
  input: SignupActionInput
): Promise<ActionResult> => {
  try {
    const { allowSelfRegistration } = await getSettings();
    if (!allowSelfRegistration) {
      return { ok: false, message: "Registration is currently disabled" };
    }

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

    await publishAdminEvent({
      kind: "signup",
      label: `${name || email} signed up as ${role}`,
    });

    return { ok: true };
  } catch (error) {
    console.error("[SIGNUP_ERROR]", error);
    return { ok: false, message: "Internal server error during signup" };
  }
};

export const executePasswordResetRequest = async (
  email: string
): Promise<ActionResult> => {
  try {
    const validated = ForgotPasswordSchema.safeParse({ email });
    if (!validated.success) {
      return { ok: false, message: "Invalid email address" };
    }

    const withinRateLimit = await checkPasswordResetRateLimit(validated.data.email);
    if (!withinRateLimit) {
      return {
        ok: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: validated.data.email },
    });

    // Security Best Practice: If user doesn't exist, don't disclose it.
    // Simply return success as if the email was sent.
    if (!user) {
      return {
        ok: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      };
    }

    // Generate token record
    const tokenRecord = await createPasswordResetToken(user.email);

    // Base URL must come from a trusted, server-controlled env var, never
    // from the request's Host header (which is attacker-controllable and
    // would let a spoofed Host leak the reset token to an attacker domain).
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/reset-password?token=${tokenRecord.token}`;

    // Send email (logs to console in dev mode)
    await sendPasswordResetEmail(user.email, resetLink);

    return {
      ok: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    };
  } catch (error) {
    console.error("[PASSWORD_RESET_REQUEST_ERROR]", error);
    return {
      ok: false,
      message: "Failed to process password reset request. Please try again.",
    };
  }
};

export const executePasswordReset = async (
  token: string,
  input: unknown
): Promise<ActionResult> => {
  try {
    if (!token) {
      return { ok: false, message: "Invalid or missing reset token" };
    }

    const validated = ResetPasswordSchema.safeParse(input);
    if (!validated.success) {
      const message = validated.error.issues[0]?.message ?? "Invalid password data";
      return { ok: false, message };
    }

    const tokenRecord = await getPasswordResetTokenByToken(token);
    if (!tokenRecord) {
      return { ok: false, message: "Invalid or expired reset token" };
    }

    // Check expiry
    if (new Date() > tokenRecord.expiresAt) {
      await deletePasswordResetToken(tokenRecord.id);
      return { ok: false, message: "Reset token has expired. Please request a new one." };
    }

    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.email },
    });

    if (!user) {
      return { ok: false, message: "User not found" };
    }

    const hashedPassword = await argon2.hash(validated.data.password);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete used token
    await deletePasswordResetToken(tokenRecord.id);

    return { ok: true };
  } catch (error) {
    console.error("[PASSWORD_RESET_EXECUTION_ERROR]", error);
    return {
      ok: false,
      message: "Failed to reset password. Please try again.",
    };
  }
};
