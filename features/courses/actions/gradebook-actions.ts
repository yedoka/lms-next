"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { revalidatePath } from "next/cache";
import * as gradebookService from "../services/gradebook-service";
import { validateCourseOwnership } from "../utils/auth";
import prisma from "@/shared/db/prisma";

export async function overrideScoreAction(
  courseId: string,
  attemptId: string,
  data: { newScore: number; reason: string },
) {
  const session = await requireAuth();

  // 1. Validate course ownership (only teacher of the course or ADMIN can override)
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  // 2. Additional check: ensure the attempt actually belongs to a quiz in this course
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          lesson: {
            select: { courseId: true },
          },
        },
      },
    },
  });

  if (!attempt || attempt.quiz.lesson.courseId !== courseId) {
    throw new Error("Invalid attempt for this course");
  }

  // 3. Apply override
  const override = await gradebookService.applyScoreOverride(attemptId, {
    ...data,
    teacherId: session.user.id!,
  });

  revalidatePath(`/dashboard/teacher/courses/${courseId}/gradebook`);
  return override;
}
