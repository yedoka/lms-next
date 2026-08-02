import prisma from "@/shared/db/prisma";
import { getRedis } from "@/shared/lib/redis";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

/**
 * Returns true if the email has not exceeded the request rate limit,
 * and records this request against the limit. Fails open (allows the
 * request) if Redis is unavailable, since this is a defense-in-depth
 * control, not the sole mitigation.
 */
export async function checkPasswordResetRateLimit(email: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = `password-reset-rate-limit:${email.toLowerCase()}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    return count <= RATE_LIMIT_MAX_REQUESTS;
  } catch (error) {
    console.error("[PASSWORD_RESET_RATE_LIMIT_ERROR]", error);
    return true;
  }
}

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
  const token = crypto.randomBytes(32).toString("hex");
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
  try {
    await prisma.passwordResetToken.delete({ where: { id } });
  } catch (error) {
    // Ignore "record not found" (already deleted); rethrow anything else
    // so a transient DB error doesn't leave a used token silently valid.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return;
    }
    throw error;
  }
}
