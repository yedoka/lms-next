import { auth } from "@/auth";
import { ROUTES } from "@/lib/auth/routes";
import { hasRequiredRole } from "@/lib/auth/route-guards";
import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const requireAuth = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.AUTH_LOGIN);
  }

  return session;
};

export const withRole = async (requiredRoles: UserRole | UserRole[]) => {
  const session = await requireAuth();

  if (!hasRequiredRole(session.user.role, requiredRoles)) {
    redirect(ROUTES.FORBIDDEN);
  }

  return session;
};
