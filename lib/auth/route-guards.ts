import type { UserRole } from "@prisma/client";
import {
  PROTECTED_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  PUBLIC_AUTH_ROUTES,
  matchesRoutePrefix,
} from "@/lib/auth/routes";
import {
  getRequiredRolesForPath,
  isRoleAllowed,
  normalizeRole,
} from "@/lib/rbac";

export const isProtectedPath = (pathname: string) =>
  PROTECTED_ROUTES.includes(pathname) ||
  PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    matchesRoutePrefix(pathname, prefix),
  );

export const isPublicAuthPath = (pathname: string) =>
  PUBLIC_AUTH_ROUTES.includes(pathname);

export const hasRequiredRole = (
  roleValue: unknown,
  allowedRoles: UserRole | UserRole[],
) => {
  const role = normalizeRole(roleValue);

  return !!role && isRoleAllowed(role, allowedRoles);
};

export const canAccessPath = (pathname: string, roleValue: unknown) => {
  const requiredRoles = getRequiredRolesForPath(pathname);

  if (!requiredRoles) {
    return true;
  }

  return hasRequiredRole(roleValue, requiredRoles);
};
