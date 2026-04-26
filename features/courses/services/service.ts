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

/**
 * Получает список курсов, на которые записан студент.
 */
export async function getStudentCourses(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
    },
    include: {
      course: {
        include: {
          teacher: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return enrollments.map((enrollment) => enrollment.course);
}
