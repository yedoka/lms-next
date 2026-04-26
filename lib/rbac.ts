import type { UserRole } from "@prisma/client";
import { matchesRoutePrefix, ROUTES } from "@/lib/auth/routes";
import { ROLE } from "@/lib/auth/roles";

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLE.STUDENT]: "Student",
  [ROLE.TEACHER]: "Teacher",
  [ROLE.ADMIN]: "Admin",
};

const DASHBOARD_ROLE_RULES: Array<{
  prefix: string;
  allowed: UserRole[];
}> = [
  { prefix: ROUTES.DASHBOARD_STUDENT, allowed: [ROLE.STUDENT, ROLE.ADMIN] },
  { prefix: ROUTES.DASHBOARD_TEACHER, allowed: [ROLE.TEACHER, ROLE.ADMIN] },
  { prefix: ROUTES.DASHBOARD_ADMIN, allowed: [ROLE.ADMIN] },
];

export const normalizeRole = (value: unknown): UserRole | null => {
  if (Object.values(ROLE).includes(value as UserRole)) {
    return value as UserRole;
  }

  return null;
};

export const isRoleAllowed = (
  role: UserRole,
  allowedRoles: UserRole | UserRole[],
) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return roles.includes(role);
};

export const getRequiredRolesForPath = (
  pathname: string,
): UserRole[] | null => {
  const routeRule = DASHBOARD_ROLE_RULES.find(
    ({ prefix }) => matchesRoutePrefix(pathname, prefix),
  );

  return routeRule ? routeRule.allowed : null;
};

export const getRoleBadgeClassName = (role: UserRole) => {
  switch (role) {
    case ROLE.ADMIN:
      return "bg-amber-100 text-amber-800";
    case ROLE.TEACHER:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
};
