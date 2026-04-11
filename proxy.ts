import { auth } from "./auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/", "/dashboard"];
const publicAuthRoutes = ["/auth/login", "/auth/signup"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicAuthRoute = publicAuthRoutes.includes(path);

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  if (isPublicAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  // This ensures the proxy doesn't run on static files or images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
