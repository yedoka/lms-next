import type { UserRole } from "@prisma/client";

export const ROLE = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
} as const satisfies Record<UserRole, UserRole>;

export const DEFAULT_ROLE: UserRole = ROLE.STUDENT;

export const ALL_ROLES = [ROLE.STUDENT, ROLE.TEACHER, ROLE.ADMIN] as const;

export const SIGNUP_ROLES = [ROLE.STUDENT, ROLE.TEACHER] as const;
