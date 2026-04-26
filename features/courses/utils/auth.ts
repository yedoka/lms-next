import prisma from "@/shared/db/prisma";
import { ROLE } from "@/features/auth/utils/roles";

/**
 * Validates if a user owns a course or has an admin role.
 * Returns the course if valid, throws an error if validation fails.
 */
export async function validateCourseOwnership(courseId: string, userId: string, role: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (role !== ROLE.ADMIN && course.teacherId !== userId) {
    throw new Error("Unauthorized: You do not own this course");
  }

  return course;
}
