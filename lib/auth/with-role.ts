import { auth } from "@/auth";
import { isRoleAllowed, normalizeRole } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

const LOGIN_PATH = "/auth/login";
const FORBIDDEN_PATH = "/forbidden";

export const requireAuth = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect(LOGIN_PATH);
  }

  return session;
};

export const withRole = async (requiredRoles: UserRole | UserRole[]) => {
  const session = await requireAuth();
  const role = normalizeRole(session.user.role);

  if (!role || !isRoleAllowed(role, requiredRoles)) {
    redirect(FORBIDDEN_PATH);
  }

  return session;
};

export const requireRole = async (requiredRoles: UserRole | UserRole[]) => {
  const session = await withRole(requiredRoles);

  return {
    session,
    userId: session.user.userId,
    role: session.user.role,
  };
};
