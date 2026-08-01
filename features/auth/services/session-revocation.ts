import { getRedis } from "@/shared/lib/redis";
import { AUTH_SESSION_TTL } from "@/features/auth/utils/config";

/**
 * Session revocation for a stateless (JWT) session strategy.
 *
 * There is no session table to delete rows from: a signed JWE stays valid until
 * its `exp`, so changing a password does nothing to a session an attacker
 * already holds. This records a per-user cutoff timestamp; every token issued
 * before it is refused in the `jwt` callback.
 *
 * Kept in Redis rather than a `passwordChangedAt` column because the two repos
 * share one database through two drifting Prisma schemas — see
 * `brain/02-data-model/schema-divergence.md`. A migration here would have to be
 * mirrored in `skillbase-express` to stay safe.
 */

const key = (userId: string) => `auth:revoked-before:${userId}`;

// Must outlive the longest possible session, or a cutoff could expire while a
// token issued before it is still valid.
const TTL_SECONDS = AUTH_SESSION_TTL.THIRTY_DAYS_SECONDS;

const nowInSeconds = () => Math.floor(Date.now() / 1000);

/** Invalidates every session issued for this user up to now. */
export async function revokeSessionsFor(userId: string): Promise<void> {
  await getRedis().set(key(userId), String(nowInSeconds()), "EX", TTL_SECONDS);
}

/**
 * True when the token was issued before this user's revocation cutoff.
 *
 * Fails open on a Redis error: a Redis outage must not sign out every user of
 * the app. The trade-off is that revocation is unenforced while Redis is down.
 */
export async function isSessionRevoked(
  userId: string,
  issuedAtSeconds: number,
): Promise<boolean> {
  try {
    const raw = await getRedis().get(key(userId));
    if (!raw) return false;

    const cutoff = Number(raw);
    if (!Number.isFinite(cutoff)) return false;

    return issuedAtSeconds < cutoff;
  } catch (error) {
    console.error("[SESSION_REVOCATION_CHECK_FAILED]", error);
    return false;
  }
}
