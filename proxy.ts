import { auth } from "./auth";
import { NextResponse } from "next/server";
import { ROUTES } from "@/features/auth/utils/routes";
import {
  canAccessPath,
  isProtectedPath,
  isPublicAuthPath,
} from "@/features/auth/utils/route-guards";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  if (isProtectedPath(path) && !isLoggedIn) {
    return NextResponse.redirect(new URL(ROUTES.AUTH_LOGIN, req.nextUrl));
  }

  if (isLoggedIn && !canAccessPath(path, req.auth?.user?.role)) {
    return NextResponse.redirect(new URL(ROUTES.FORBIDDEN, req.nextUrl));
  }

  if (isPublicAuthPath(path) && isLoggedIn) {
    return NextResponse.redirect(new URL(ROUTES.HOME, req.nextUrl));
  }
});

export const config = {
  // This ensures the proxy doesn't run on static files or images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
