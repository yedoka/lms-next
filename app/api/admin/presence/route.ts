import { auth } from "@/auth";
import { ROLE } from "@/features/auth/utils/roles";
import { getRedis } from "@/shared/lib/redis";
import { NextResponse } from "next/server";

const PRESENCE_PREFIX = "presence:";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (session.user.role !== ROLE.ADMIN) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const redis = getRedis();

  // SCAN (not KEYS) so we never block Redis on a large keyspace
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = await redis.scan(
      cursor,
      "MATCH",
      `${PRESENCE_PREFIX}*`,
      "COUNT",
      100,
    );
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");

  const byRole = { STUDENT: 0, TEACHER: 0, ADMIN: 0 } as Record<string, number>;
  if (keys.length > 0) {
    const roles = await redis.mget(keys);
    for (const role of roles) {
      if (role && role in byRole) byRole[role] += 1;
    }
  }

  return NextResponse.json({ online: keys.length, byRole });
}
