"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { revalidatePath } from "next/cache";
import prisma from "@/shared/db/prisma";
import * as quizService from "../services/quiz-service";
import {
  quizSchema,
  questionSchema,
  answerSchema,
  QuizFormData,
  QuestionFormData,
  AnswerFormData,
  reorderQuestionsSchema,
  submitQuizSchema,
  SubmitQuizData,
} from "../schemas/quiz";
import {
  validateLessonOwnership,
  validateQuizOwnership,
  validateQuestionOwnership,
  validateAnswerOwnership,
} from "../utils/auth";
import { publishAdminEvent } from "@/shared/lib/publish-admin-event";
import {
  getAttemptWindowStart,
  clearAttemptWindow,
  SUBMIT_GRACE_SECONDS,
} from "../services/quiz-attempt-window";

export async function createQuizAction(lessonId: string, data: QuizFormData) {
  const session = await requireAuth();
  const { courseId } = await validateLessonOwnership(lessonId, session.user.id!, session.user.role!);

  const parsed = quizSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const quiz = await quizService.createQuiz(lessonId, parsed.data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return quiz;
}

export async function updateQuizAction(quizId: string, data: Partial<QuizFormData>) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateQuizOwnership(quizId, session.user.id!, session.user.role!);

  const parsed = quizSchema.partial().safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const quiz = await quizService.updateQuiz(quizId, parsed.data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return quiz;
}

export async function deleteQuizAction(quizId: string) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateQuizOwnership(quizId, session.user.id!, session.user.role!);

  await quizService.deleteQuiz(quizId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function createQuestionAction(
  quizId: string,
  type: "MULTIPLE_CHOICE" | "BOOLEAN",
) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateQuizOwnership(quizId, session.user.id!, session.user.role!);

  const question = await quizService.createQuestion(quizId, {
    text: "New Question",
    type,
    points: 1,
  });
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return question;
}

export async function updateQuestionAction(
  questionId: string,
  data: Partial<QuestionFormData>,
) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateQuestionOwnership(questionId, session.user.id!, session.user.role!);

  const parsed = questionSchema.partial().safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const question = await quizService.updateQuestion(questionId, parsed.data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return question;
}

export async function deleteQuestionAction(questionId: string) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateQuestionOwnership(questionId, session.user.id!, session.user.role!);

  await quizService.deleteQuestion(questionId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function reorderQuestionsAction(
  quizId: string,
  updates: { id: string; position: number }[],
) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateQuizOwnership(quizId, session.user.id!, session.user.role!);

  const parsed = reorderQuestionsSchema.safeParse({ questions: updates });
  if (!parsed.success) {
    throw new Error("Invalid reorder data");
  }

  await quizService.reorderQuestions(quizId, updates);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function createAnswerAction(questionId: string) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateQuestionOwnership(questionId, session.user.id!, session.user.role!);

  const answer = await quizService.createAnswer(questionId, {
    text: "New Answer",
    isCorrect: false,
  });
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return answer;
}

export async function updateAnswerAction(
  answerId: string,
  data: Partial<AnswerFormData>,
) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateAnswerOwnership(answerId, session.user.id!, session.user.role!);

  const parsed = answerSchema.partial().safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const answer = await quizService.updateAnswer(answerId, parsed.data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return answer;
}

export async function deleteAnswerAction(answerId: string) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateAnswerOwnership(answerId, session.user.id!, session.user.role!);

  await quizService.deleteAnswer(answerId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function setCorrectAnswerAction(questionId: string, answerId: string) {
  const session = await requireAuth();
  const { courseId, lessonId } = await validateQuestionOwnership(questionId, session.user.id!, session.user.role!);

  // The answer must belong to the same question, otherwise a caller could flip
  // the key on a question they do not own by pairing it with one they do.
  const { questionId: answerQuestionId } = await validateAnswerOwnership(
    answerId,
    session.user.id!,
    session.user.role!,
  );

  if (answerQuestionId !== questionId) {
    throw new Error("Answer does not belong to this question");
  }

  await quizService.setCorrectAnswer(questionId, answerId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function submitQuizAction(
  courseId: string,
  lessonId: string,
  data: SubmitQuizData,
) {
  const session = await requireAuth();
  if (!session.user.id) throw new Error("Unauthorized");

  const parsed = submitQuizSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid quiz submission data");
  }

  // Verify quiz belongs to course/lesson and is published
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: parsed.data.quizId,
      lessonId: lessonId,
      isPublished: true,
      lesson: {
        courseId: courseId,
      },
    },
  });

  if (!quiz) {
    throw new Error("Quiz not found or not published");
  }

  // Verify enrollment or role
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  const isTeacher = await prisma.course
    .findUnique({ where: { id: courseId }, select: { teacherId: true } })
    .then((c) => c?.teacherId === session.user.id);
  const isAdmin = session.user.role === "ADMIN";

  if (!enrollment && !isTeacher && !isAdmin) {
    throw new Error("You are not authorized to submit this quiz");
  }

  // Enforce the time limit on the server. The client timer is a display; it
  // resets on reload and can simply be ignored by a direct call to this action.
  if (quiz.timeLimit) {
    const startedAt = await getAttemptWindowStart(session.user.id, quiz.id);

    if (startedAt === null) {
      throw new Error("Your time for this quiz has expired");
    }

    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    if (elapsedSeconds > quiz.timeLimit * 60 + SUBMIT_GRACE_SECONDS) {
      throw new Error("Your time for this quiz has expired");
    }
  }

  const attempt = await quizService.gradeQuizAttempt(
    session.user.id,
    parsed.data.quizId,
    parsed.data.answers,
  );

  // The attempt is recorded; a retake must get a fresh countdown.
  await clearAttemptWindow(session.user.id, quiz.id);

  await publishAdminEvent({
    kind: "quiz_completed",
    label: `${session.user.name ?? "A student"} completed "${quiz.title}" — ${attempt.score}% (${attempt.passed ? "passed" : "failed"})`,
  });

  revalidatePath(`/dashboard`);
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);

  return { success: true, attemptId: attempt.id };
}
