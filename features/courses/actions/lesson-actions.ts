"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { revalidatePath } from "next/cache";
import * as lessonService from "../services/lesson-service";
import { lessonSchema, LessonFormData, reorderLessonsSchema } from "../schemas/lesson";
import { validateCourseOwnership } from "../utils/auth";
import prisma from "@/shared/db/prisma";
import { publishNotification } from "@/shared/lib/publish-notification";

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

  // Check current publish state before updating
  const currentLesson = data.isPublished
    ? await prisma.lesson.findUnique({ where: { id: lessonId }, select: { isPublished: true, title: true } })
    : null;

  const lesson = await lessonService.updateLesson(lessonId, data);

  // Notify all enrolled students when a lesson is newly published
  if (data.isPublished && currentLesson && !currentLesson.isPublished) {
    const [enrollments, course] = await Promise.all([
      prisma.enrollment.findMany({ where: { courseId }, select: { userId: true } }),
      prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    ]);
    if (course) {
      await Promise.all(
        enrollments.map((e) =>
          publishNotification({
            userId: e.userId,
            type: "LESSON",
            message: `New lesson "${lesson.title}" published in "${course.title}"`,
          }),
        ),
      );
    }
  }

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

export async function createLessonAttachmentAction(courseId: string, lessonId: string, name: string, url: string, size: number) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  const attachment = await lessonService.addLessonAttachment(lessonId, name, url, size);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/edit`);
  return attachment;
}

export async function deleteLessonAttachmentAction(courseId: string, attachmentId: string) {
  const session = await requireAuth();
  await validateCourseOwnership(courseId, session.user.id!, session.user.role!);

  await lessonService.deleteLessonAttachment(attachmentId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/edit`);
}
