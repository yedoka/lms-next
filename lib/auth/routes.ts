export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  DASHBOARD_STUDENT: "/dashboard/student",
  DASHBOARD_TEACHER: "/dashboard/teacher",
  DASHBOARD_ADMIN: "/dashboard/admin",
  AUTH_LOGIN: "/auth/login",
  AUTH_SIGNUP: "/auth/signup",
  API_AUTH_SIGNUP: "/api/auth/signup",
  FORBIDDEN: "/forbidden",
} as const;

export const PROTECTED_ROUTES: ReadonlyArray<string> = [ROUTES.HOME];
export const PROTECTED_ROUTE_PREFIXES: ReadonlyArray<string> = [ROUTES.DASHBOARD];
export const PUBLIC_AUTH_ROUTES: ReadonlyArray<string> = [
  ROUTES.AUTH_LOGIN,
  ROUTES.AUTH_SIGNUP,
];

export const matchesRoutePrefix = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);
