import type { UserRole } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  ADMIN: "Admin",
};

const DASHBOARD_ROLE_RULES: Array<{
  prefix: string;
  allowed: UserRole[];
}> = [
  { prefix: "/dashboard/student", allowed: ["STUDENT", "ADMIN"] },
  { prefix: "/dashboard/teacher", allowed: ["TEACHER", "ADMIN"] },
  { prefix: "/dashboard/admin", allowed: ["ADMIN"] },
];

export const normalizeRole = (value: unknown): UserRole | null => {
  if (value === "STUDENT" || value === "TEACHER" || value === "ADMIN") {
    return value;
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
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return routeRule ? routeRule.allowed : null;
};

export const getRoleBadgeClassName = (role: UserRole) => {
  switch (role) {
    case "ADMIN":
      return "bg-amber-100 text-amber-800";
    case "TEACHER":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
};
