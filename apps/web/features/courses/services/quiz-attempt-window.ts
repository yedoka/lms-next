import { getRedis } from "@/shared/lib/redis";

/**
 * Server-side start timestamps for timed quiz attempts.
 *
 * The client timer alone enforces nothing: no attempt row exists until submit,
 * so before this there was no server-known start time and a reload simply reset
 * the clock. The marker below is what the deadline is actually derived from.
 *
 * Redis rather than a `QuizAttempt` column because the two repos share one
 * database through two Prisma schemas that have already drifted, so a migration
 * would have to land in both to avoid breaking the live-quiz grader.
 */

/** Absorbs clock skew and the latency of the submit round trip. */
export const SUBMIT_GRACE_SECONDS = 15;

/** Retention for the marker of a quiz that has no time limit. */
const UNTIMED_WINDOW_TTL_SECONDS = 60 * 60 * 24;

const key = (userId: string, quizId: string) => `quiz:attempt:${userId}:${quizId}:startedAt`;

/**
 * Records when this user's attempt at this quiz began, once. Repeated calls —
 * a page reload, a second tab — keep the original timestamp, which is the whole
 * point: the countdown must not restart.
 *
 * Returns the effective start time in epoch milliseconds.
 */
export async function startAttemptWindow(
  userId: string,
  quizId: string,
  timeLimitMinutes: number | null,
): Promise<number> {
  const redis = getRedis();
  const now = Date.now();
  const ttl = timeLimitMinutes
    ? timeLimitMinutes * 60 + SUBMIT_GRACE_SECONDS
    : UNTIMED_WINDOW_TTL_SECONDS;

  const claimed = await redis.set(key(userId, quizId), String(now), "EX", ttl, "NX");

  if (claimed) return now;

  const existing = await redis.get(key(userId, quizId));
  const parsed = existing ? Number(existing) : NaN;

  return Number.isFinite(parsed) ? parsed : now;
}

/**
 * Reads the recorded start time, or null when no window is open — either the
 * attempt was never started through the quiz page, or its TTL has already run
 * past the time limit plus grace.
 */
export async function getAttemptWindowStart(
  userId: string,
  quizId: string,
): Promise<number | null> {
  const value = await getRedis().get(key(userId, quizId));
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Clears the window so a retake starts a fresh countdown. */
export async function clearAttemptWindow(userId: string, quizId: string): Promise<void> {
  await getRedis().del(key(userId, quizId));
}
