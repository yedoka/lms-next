export const ROUTES = {
  HOME: "/",
  COURSES: "/courses",
  COURSE_DETAILS: (id: string) => `/courses/${id}`,
  COURSE_LESSON: (courseId: string, lessonId: string) =>
    `/courses/${courseId}/lessons/${lessonId}`,
  DASHBOARD: "/dashboard",
  DASHBOARD_STUDENT: "/dashboard/student",
  DASHBOARD_STUDENT_COURSES: "/dashboard/student/courses",
  DASHBOARD_TEACHER: "/dashboard/teacher",
  DASHBOARD_TEACHER_COURSES: "/dashboard/teacher/courses",
  DASHBOARD_TEACHER_COURSE_CREATE: "/dashboard/teacher/courses/create",
  DASHBOARD_TEACHER_COURSE_EDIT: (id: string) =>
    `/dashboard/teacher/courses/${id}/edit`,
  DASHBOARD_ADMIN: "/dashboard/admin",
  DASHBOARD_ADMIN_USERS: "/dashboard/admin/users",
  DASHBOARD_ADMIN_SETTINGS: "/dashboard/admin/settings",
  DASHBOARD_SETTINGS: "/dashboard/settings",
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
