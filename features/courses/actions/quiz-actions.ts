"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { revalidatePath } from "next/cache";
import prisma from "@/shared/db/prisma";
import * as quizService from "../services/quiz-service";
import {
  quizSchema,
  QuizFormData,
  QuestionFormData,
  AnswerFormData,
  reorderQuestionsSchema,
  submitQuizSchema,
  SubmitQuizData,
} from "../schemas/quiz";
import { validateCourseOwnership } from "../utils/auth";

export async function createQuizAction(
  courseId: string,
  lessonId: string,
  data: QuizFormData,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const parsed = quizSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const quiz = await quizService.createQuiz(lessonId, parsed.data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return quiz;
}

export async function updateQuizAction(
  courseId: string,
  lessonId: string,
  quizId: string,
  data: Partial<QuizFormData>,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const quiz = await quizService.updateQuiz(quizId, data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return quiz;
}

export async function deleteQuizAction(
  courseId: string,
  lessonId: string,
  quizId: string,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  await quizService.deleteQuiz(quizId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function createQuestionAction(
  courseId: string,
  lessonId: string,
  quizId: string,
  type: "MULTIPLE_CHOICE" | "BOOLEAN",
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const question = await quizService.createQuestion(quizId, {
    text: "New Question",
    type,
    points: 1,
  });
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return question;
}

export async function updateQuestionAction(
  courseId: string,
  lessonId: string,
  questionId: string,
  data: Partial<QuestionFormData>,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const question = await quizService.updateQuestion(questionId, data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return question;
}

export async function deleteQuestionAction(
  courseId: string,
  lessonId: string,
  questionId: string,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  await quizService.deleteQuestion(questionId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function reorderQuestionsAction(
  courseId: string,
  lessonId: string,
  quizId: string,
  updates: { id: string; position: number }[],
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const parsed = reorderQuestionsSchema.safeParse({ questions: updates });
  if (!parsed.success) {
    throw new Error("Invalid reorder data");
  }

  await quizService.reorderQuestions(quizId, updates);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function createAnswerAction(
  courseId: string,
  lessonId: string,
  questionId: string,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const answer = await quizService.createAnswer(questionId, {
    text: "New Answer",
    isCorrect: false,
  });
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return answer;
}

export async function updateAnswerAction(
  courseId: string,
  lessonId: string,
  answerId: string,
  data: Partial<AnswerFormData>,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const answer = await quizService.updateAnswer(answerId, data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
  return answer;
}

export async function deleteAnswerAction(
  courseId: string,
  lessonId: string,
  answerId: string,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  await quizService.deleteAnswer(answerId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}`);
}

export async function setCorrectAnswerAction(
  courseId: string,
  lessonId: string,
  questionId: string,
  answerId: string,
) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  // If it's multiple choice or boolean, we need to make sure only ONE answer is correct
  // We can do this safely inside the service, but since we are writing an action let's do it in a tx if needed,
  // or just handle it here: find all answers for question, set them to false, set this one to true.

  // To avoid circular dependencies let's import prisma here, or add a method to quiz-service.
  // We'll add setCorrectAnswer to quizService and call it here.
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

  const attempt = await quizService.gradeQuizAttempt(
    session.user.id,
    parsed.data.quizId,
    parsed.data.answers,
  );

  revalidatePath(`/dashboard`);
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);

  return { success: true, attemptId: attempt.id };
}
