import Redis from "ioredis";

const ACTIVITY_CHANNEL = "admin:activity";

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not defined");
    publisher = new Redis(url);
  }
  return publisher;
}

export type AdminEventKind = "signup" | "enrollment" | "quiz_completed";

// Fire-and-forget broadcast to admins watching the live activity feed.
// Publish failure is non-fatal — the underlying action already succeeded.
export async function publishAdminEvent(event: {
  kind: AdminEventKind;
  label: string;
}) {
  try {
    const pub = getPublisher();
    await pub.publish(
      ACTIVITY_CHANNEL,
      JSON.stringify({ ...event, at: new Date().toISOString() }),
    );
  } catch {
    // ignore
  }
}
