import prisma from "@/shared/db/prisma";
import { ROLE } from "@/features/auth/utils/roles";

/**
 * Validates if a user owns a course or has an admin role.
 * Throws an error if validation fails.
 */
export async function validateCourseOwnership(courseId: string, userId: string, role: string) {
  if (role === ROLE.ADMIN) return true;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.teacherId !== userId) {
    throw new Error("Unauthorized: You do not own this course");
  }

  return true;
}
