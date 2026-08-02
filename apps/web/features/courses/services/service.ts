import prisma from "@/shared/db/prisma";

/**
 * Получает список курсов, созданных конкретным преподавателем.
 */
export async function getTeacherCourses(teacherId: string) {
  return prisma.course.findMany({
    where: {
      teacherId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

