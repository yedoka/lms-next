import { auth } from "./auth";
import { NextResponse } from "next/server";
import {
  getRequiredRolesForPath,
  isRoleAllowed,
  normalizeRole,
} from "@/lib/rbac";

const protectedRoutes = ["/"];
const protectedRoutePrefixes = ["/dashboard"];
const publicAuthRoutes = ["/auth/login", "/auth/signup"];

const matchesRoutePrefix = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isProtectedRoute =
    protectedRoutes.includes(path) ||
    protectedRoutePrefixes.some((prefix) => matchesRoutePrefix(path, prefix));
  const isPublicAuthRoute = publicAuthRoutes.includes(path);

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  const requiredRoles = getRequiredRolesForPath(path);

  if (requiredRoles && isLoggedIn) {
    const role = normalizeRole(req.auth?.user?.role);

    if (!role || !isRoleAllowed(role, requiredRoles)) {
      return NextResponse.redirect(new URL("/forbidden", req.nextUrl));
    }
  }

  if (isPublicAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  // This ensures the proxy doesn't run on static files or images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
