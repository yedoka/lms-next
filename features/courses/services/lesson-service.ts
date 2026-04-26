import prisma from "@/shared/db/prisma";
import { LessonFormData } from "../schemas/lesson";

export async function getLessons(courseId: string) {
  return prisma.lesson.findMany({
    where: { courseId },
    orderBy: { position: "asc" },
  });
}

export async function createLesson(courseId: string, data: LessonFormData) {
  const lastLesson = await prisma.lesson.findFirst({
    where: { courseId },
    orderBy: { position: "desc" },
  });

  const newPosition = lastLesson ? lastLesson.position + 1 : 0;

  return prisma.lesson.create({
    data: {
      ...data,
      courseId,
      position: newPosition,
    },
  });
}

export async function updateLesson(id: string, data: Partial<LessonFormData>) {
  return prisma.lesson.update({
    where: { id },
    data,
  });
}

export async function deleteLesson(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { courseId: true, position: true },
  });

  if (!lesson) throw new Error("Lesson not found");

  const deletedLesson = await prisma.lesson.delete({
    where: { id },
  });

  // Reorder remaining lessons
  await prisma.lesson.updateMany({
    where: {
      courseId: lesson.courseId,
      position: { gt: lesson.position },
    },
    data: {
      position: { decrement: 1 },
    },
  });

  return deletedLesson;
}

export async function reorderLessons(
  courseId: string,
  updates: { id: string; position: number }[]
) {
  return prisma.$transaction(
    updates.map((update) =>
      prisma.lesson.update({
        where: { id: update.id, courseId },
        data: { position: update.position },
      })
    )
  );
}
