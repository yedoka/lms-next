"use server";

import prisma from "@/shared/db/prisma";
import { requireAuth } from "@/features/auth/utils/with-role";

export async function markLessonAsComplete(lessonId: string) {
  const session = await requireAuth();

  if (!session.user.id) {
    throw new Error("Unauthorized: No user ID");
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