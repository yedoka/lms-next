"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { validateCourseOwnership } from "@/features/courses/utils/auth";
import prisma from "@/shared/db/prisma";
import { createLiveSession } from "../services/live-session-service";

export async function startLiveSessionAction(
  courseId: string,
  lessonId: string,
  quizId: string,
  secondsPerQuestion: number = 20,
): Promise<{ code: string }> {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      lessonId,
      lesson: { courseId },
    },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { answers: true },
      },
    },
  });

  if (!quiz) throw new Error("Quiz not found");
  if (!quiz.isPublished)
    throw new Error("Quiz must be published to start a live session");
  if (quiz.questions.length === 0)
    throw new Error("Quiz must have at least one question");

  return createLiveSession({
    quizId: quiz.id,
    courseId,
    lessonId,
    teacherId: session.user.id!,
    title: quiz.title,
    passingScore: quiz.passingScore,
    secondsPerQuestion,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      points: q.points,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        isCorrect: a.isCorrect,
      })),
    })),
  });
}
