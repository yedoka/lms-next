-- Fix drift from the previous migration: schema.prisma declares `email` as
-- @unique on PasswordResetToken, but the original migration only created a
-- composite (email, token) unique index, not a single-column one on email.
-- password-reset-service.ts upserts on `where: { email }`, which requires a
-- unique/exclusion constraint on exactly that column to work.
DROP INDEX IF EXISTS "PasswordResetToken_email_token_key";

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_email_key" ON "PasswordResetToken"("email");
