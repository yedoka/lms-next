import prisma from "@/shared/db/prisma";

export interface GradebookEntry {
  student: {
    id: string;
    name: string | null;
    email: string;
  };
  quizzes: {
    quizId: string;
    quizTitle: string;
    bestScore: number | null;
    bestAttemptId: string | null;
    passed: boolean | null;
    isOverridden: boolean;
  }[];
}

export async function getCourseGradebook(courseId: string) {
  // 1. Get all enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // 2. Get all quizzes in the course
  const quizzes = await prisma.quiz.findMany({
    where: {
      lesson: {
        courseId,
      },
    },
    select: {
      id: true,
      title: true,
    },
  });

  // 3. Get all attempts for these students and these quizzes
  const studentIds = enrollments.map((e) => e.userId);
  const quizIds = quizzes.map((q) => q.id);

  const allAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: { in: studentIds },
      quizId: { in: quizIds },
    },
    include: {
      override: true,
    },
    orderBy: {
      score: "desc",
    },
  });

  // 4. Transform into GradebookEntry[]
  const gradebook: GradebookEntry[] = enrollments.map((enrollment) => {
    const student = enrollment.user;
    const studentQuizzes = quizzes.map((quiz) => {
      // Find the best attempt for this student and this quiz
      // Since they are ordered by score desc, the first one we find is the best
      const attempts = allAttempts.filter(
        (a) => a.userId === student.id && a.quizId === quiz.id,
      );

      const bestAttempt = attempts[0] || null;

      return {
        quizId: quiz.id,
        quizTitle: quiz.title,
        bestScore: bestAttempt
          ? bestAttempt.override
            ? bestAttempt.override.newScore
            : bestAttempt.score
          : null,
        bestAttemptId: bestAttempt?.id || null,
        passed: bestAttempt?.passed || null,
        isOverridden: !!bestAttempt?.override,
      };
    });

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      quizzes: studentQuizzes,
    };
  });

  return {
    gradebook,
    quizzes, // Return quizzes list for table headers
  };
}

export async function getQuizAttemptsForGradebook(courseId: string) {
  return prisma.quizAttempt.findMany({
    where: {
      quiz: {
        lesson: {
          courseId,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      quiz: {
        select: {
          id: true,
          title: true,
        },
      },
      override: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });
}

export async function applyScoreOverride(
  attemptId: string,
  data: { newScore: number; reason: string; teacherId: string },
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new Error("Quiz attempt not found");
  }

  return prisma.quizOverride.upsert({
    where: { quizAttemptId: attemptId },
    update: {
      newScore: data.newScore,
      reason: data.reason,
      createdBy: data.teacherId,
    },
    create: {
      quizAttemptId: attemptId,
      originalScore: attempt.score,
      newScore: data.newScore,
      reason: data.reason,
      createdBy: data.teacherId,
    },
  });
}
