import prisma from "@/shared/db/prisma";
import { getEffectiveScore } from "@/features/courses/utils/effective-score";

export async function getStudentDashboardData(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          teacher: {
            select: { name: true },
          },
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: { id: true, title: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (enrollments.length === 0) {
    return [];
  }

  const lessonIds = enrollments.flatMap((e) =>
    e.course.lessons.map((l) => l.id),
  );

  const progressRecords = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
      isCompleted: true,
    },
  });

  const progressMap = new Map(
    progressRecords.map((p) => [p.lessonId, p.completedAt]),
  );

  const attemptRecords = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      override: { select: { newScore: true } },
      quiz: {
        select: { lessonId: true },
      },
    },
  });

  return enrollments.map((enrollment) => {
    const course = enrollment.course;
    const publishedLessons = course.lessons;
    const totalLessons = publishedLessons.length;

    const completedLessons = publishedLessons.filter((l) =>
      progressMap.has(l.id),
    );
    const completedCount = completedLessons.length;

    const progressPercentage =
      totalLessons === 0
        ? 0
        : Math.round((completedCount / totalLessons) * 100);

    // Find first incomplete lesson
    const nextLesson = publishedLessons.find((l) => !progressMap.has(l.id));

    // Fetch quiz attempts for this course's lessons
    const courseLessonIds = publishedLessons.map((l) => l.id);
    const courseAttempts = attemptRecords.filter((a) =>
      courseLessonIds.includes(a.quiz.lessonId),
    );
    const bestQuizScore =
      courseAttempts.length > 0
        ? Math.max(...courseAttempts.map(getEffectiveScore))
        : null;

    // Most recent lesson completion or quiz submission in this course. Drives
    // which course the dashboard offers to continue.
    const activityDates = [
      ...completedLessons.map((l) => progressMap.get(l.id)),
      ...courseAttempts.map((a) => a.submittedAt),
    ].filter((date): date is Date => date !== null && date !== undefined);

    const lastActivityAt =
      activityDates.length > 0
        ? new Date(Math.max(...activityDates.map((d) => d.getTime())))
        : null;

    return {
      courseId: course.id,
      title: course.title,
      thumbnail: course.thumbnail,
      category: course.category,
      teacherName: course.teacher?.name || "Unknown Teacher",
      totalLessons,
      completedCount,
      progressPercentage,
      nextLessonId: nextLesson?.id || null, // If null, all completed or no lessons
      nextLessonTitle: nextLesson?.title || null,
      bestQuizScore,
      lastActivityAt,
    };
  });
}
