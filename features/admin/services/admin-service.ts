import prisma from "@/shared/db/prisma";
import type { UserRole } from "@prisma/client";

export interface PlatformStats {
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalAttempts: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    totalUsers,
    usersByRoleRaw,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    totalAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    prisma.course.count(),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.enrollment.count(),
    prisma.quizAttempt.count(),
  ]);

  const usersByRole: Record<UserRole, number> = {
    STUDENT: 0,
    TEACHER: 0,
    ADMIN: 0,
  };
  for (const row of usersByRoleRaw) {
    usersByRole[row.role] = row._count.id;
  }

  return { totalUsers, usersByRole, totalCourses, publishedCourses, totalEnrollments, totalAttempts };
}

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getSignupsOverTime(days = 30): Promise<TimeSeriesPoint[]> {
  const cutoff = daysAgo(days);
  const rows = await prisma.$queryRaw<{ day: Date; count: number }[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "User"
    WHERE "createdAt" >= ${cutoff}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({ date: toDateKey(new Date(r.day)), count: r.count }));
}

export async function getEnrollmentsOverTime(days = 30): Promise<TimeSeriesPoint[]> {
  const cutoff = daysAgo(days);
  const rows = await prisma.$queryRaw<{ day: Date; count: number }[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "Enrollment"
    WHERE "createdAt" >= ${cutoff}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({ date: toDateKey(new Date(r.day)), count: r.count }));
}

export interface PassRateStats {
  passed: number;
  total: number;
  rate: number; // 0-100
}

export async function getQuizPassRate(): Promise<PassRateStats> {
  const [total, passed] = await Promise.all([
    prisma.quizAttempt.count({ where: { submittedAt: { not: null } } }),
    prisma.quizAttempt.count({ where: { submittedAt: { not: null }, passed: true } }),
  ]);
  const rate = total === 0 ? 0 : Math.round((passed / total) * 100);
  return { passed, total, rate };
}

export async function getRecentUsers(limit = 5) {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRecentCourses(limit = 5) {
  return prisma.course.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      isPublished: true,
      createdAt: true,
      teacher: { select: { name: true, email: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
}

export async function getAllUsers(filters: UserFilters = {}) {
  return prisma.user.findMany({
    where: {
      AND: [
        filters.role ? { role: filters.role } : {},
        filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { enrollments: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUsersForExport() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { enrollments: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEnrollmentsForExport() {
  return prisma.enrollment.findMany({
    select: {
      id: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      course: {
        select: { title: true, teacher: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export interface CourseFilters {
  search?: string;
  isPublished?: boolean;
}

export async function getAllCourses(filters: CourseFilters = {}) {
  return prisma.course.findMany({
    where: {
      AND: [
        filters.isPublished !== undefined ? { isPublished: filters.isPublished } : {},
        filters.search
          ? { title: { contains: filters.search, mode: "insensitive" } }
          : {},
      ],
    },
    select: {
      id: true,
      title: true,
      category: true,
      isPublished: true,
      createdAt: true,
      teacher: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true, lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
