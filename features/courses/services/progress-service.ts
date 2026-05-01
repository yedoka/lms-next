import prisma from "@/shared/db/prisma";

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

  const progressMap = new Set(progressRecords.map((p) => p.lessonId));

  const attemptRecords = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
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
    const bestQuizScore = attemptRecords
      .filter((a) => courseLessonIds.includes(a.quiz.lessonId))
      .reduce((max, attempt) => Math.max(max, attempt.score), 0);

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
      bestQuizScore: bestQuizScore > 0 ? bestQuizScore : null,
    };
  });
}
