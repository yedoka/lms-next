export const AUTH_SESSION_TTL = {
  ONE_DAY_SECONDS: 24 * 60 * 60,
  THIRTY_DAYS_SECONDS: 30 * 24 * 60 * 60,
} as const;

// How often the JWT callback re-checks the user's role against the database.
// Bounds how long a stale session can keep an old role after an admin promotes
// or demotes the user before they are forced to re-authenticate.
export const ROLE_SYNC_INTERVAL_SECONDS = 30;
