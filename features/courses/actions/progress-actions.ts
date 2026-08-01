"use server";

import prisma from "@/shared/db/prisma";
import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";

export async function markLessonAsComplete(lessonId: string) {
  const session = await requireAuth();

  if (!session.user.id) {
    throw new Error("Unauthorized: No user ID");
  }

  // The lesson must exist, be published, and belong to a course the caller is
  // enrolled in — or owns, or is an admin over, so lesson preview still works.
  // Without this any authenticated user could write progress rows for arbitrary
  // lesson ids, which also pollutes the activity chart and feed.
  // Mirrors the authorization contract of `submitQuizAction`.
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      isPublished: true,
      course:
        session.user.role === ROLE.ADMIN
          ? undefined
          : {
              OR: [
                { enrollments: { some: { userId: session.user.id } } },
                { teacherId: session.user.id },
              ],
            },
    },
    select: { id: true },
  });

  if (!lesson) {
    throw new Error("Lesson not found or you are not enrolled in this course");
  }

  const existingProgress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
  });

  if (existingProgress?.isCompleted) {
    return { success: true, message: "Already completed" };
  }

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
    update: {
      isCompleted: true,
      completedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      lessonId,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  return { success: true, message: "Lesson marked as complete" };
}