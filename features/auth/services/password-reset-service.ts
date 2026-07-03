import prisma from "@/shared/db/prisma";
import crypto from "crypto";

export interface PasswordResetTokenRecord {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Creates or updates a password reset token for a user.
 */
export async function createPasswordResetToken(email: string): Promise<PasswordResetTokenRecord> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Upsert token: since email has a unique constraint, we can upsert cleanly on email alone.
  return prisma.passwordResetToken.upsert({
    where: { email },
    create: {
      email,
      token,
      expiresAt,
    },
    update: {
      token,
      expiresAt,
    },
  });
}

/**
 * Retrieves a password reset token record.
 */
export async function getPasswordResetTokenByToken(token: string): Promise<PasswordResetTokenRecord | null> {
  return prisma.passwordResetToken.findUnique({
    where: { token },
  });
}

/**
 * Deletes a password reset token by its ID.
 */
export async function deletePasswordResetToken(id: string): Promise<void> {
  await prisma.passwordResetToken.delete({
    where: { id },
  }).catch(() => {
    // Ignore error if already deleted
  });
}
