// The client itself lives in packages/db so the realtime server shares it.
// Kept here as a re-export so existing `@/shared/db/prisma` imports keep working.
import { prisma } from "@skillbase/db";

export { prisma };
export default prisma;
