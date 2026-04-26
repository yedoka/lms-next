import prisma from "@/shared/db/prisma";

/**
 * Получает список курсов, созданных конкретным преподавателем.
 */
export async function getTeacherCourses(teacherId: string) {
  // В Next.js 16 мы можем использовать "use cache" на уровне функции
  // Но для начала реализуем базовый запрос.
  return prisma.course.findMany({
    where: {
      teacherId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
