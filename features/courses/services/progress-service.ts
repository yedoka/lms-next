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

  const lessonIds = enrollments.flatMap((e) => e.course.lessons.map((l) => l.id));

  const progressRecords = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
      isCompleted: true,
    },
  });

  const progressMap = new Set(progressRecords.map((p) => p.lessonId));

  return enrollments.map((enrollment) => {
    const course = enrollment.course;
    const publishedLessons = course.lessons;
    const totalLessons = publishedLessons.length;

    const completedLessons = publishedLessons.filter((l) => progressMap.has(l.id));
    const completedCount = completedLessons.length;

    const progressPercentage =
      totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

    // Find first incomplete lesson
    const nextLesson = publishedLessons.find((l) => !progressMap.has(l.id));

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
    };
  });
}