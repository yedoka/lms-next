"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { revalidatePath } from "next/cache";
import * as lessonService from "../services/lesson-service";
import { lessonSchema, LessonFormData, reorderLessonsSchema } from "../schemas/lesson";
import { validateCourseOwnership } from "../utils/auth";

export async function createLessonAction(courseId: string, data: LessonFormData) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const parsed = lessonSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const lesson = await lessonService.createLesson(courseId, parsed.data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/edit`);
  return lesson;
}

export async function updateLessonAction(courseId: string, lessonId: string, data: Partial<LessonFormData>) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const lesson = await lessonService.updateLesson(lessonId, data);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/edit`);
  return lesson;
}

export async function deleteLessonAction(courseId: string, lessonId: string) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  await lessonService.deleteLesson(lessonId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/edit`);
}

export async function reorderLessonsAction(courseId: string, updates: { id: string; position: number }[]) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const parsed = reorderLessonsSchema.safeParse({ lessons: updates });
  if (!parsed.success) {
    throw new Error("Invalid reorder data");
  }

  await lessonService.reorderLessons(courseId, updates);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/edit`);
}
