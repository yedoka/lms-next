"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { revalidatePath } from "next/cache";
import * as gradebookService from "../services/gradebook-service";
import { validateCourseOwnership } from "../utils/auth";
import prisma from "@/shared/db/prisma";

import { z } from "zod";

const overrideScoreSchema = z.object({
  newScore: z.number().int().min(0).max(100),
  reason: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? null : v)),
});

export async function overrideScoreAction(
  courseId: string,
  attemptId: string,
  data: z.infer<typeof overrideScoreSchema>,
) {
  const session = await requireAuth();

  const parsed = overrideScoreSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid override data");
  }

  // 1. Validate course ownership (only teacher of the course or ADMIN can override)
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);
  // ...

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
    newScore: parsed.data.newScore,
    reason: parsed.data.reason ?? null,
    teacherId: session.user.id!,
  });

  revalidatePath(`/dashboard/teacher/courses/${courseId}/gradebook`);
  return override;
}
