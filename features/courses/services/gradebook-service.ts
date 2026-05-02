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
      passingScore: true,
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
  });

  // Group attempts by student and quiz for O(1) lookup
  const attemptsMap = new Map<string, typeof allAttempts>();
  for (const attempt of allAttempts) {
    const key = `${attempt.userId}-${attempt.quizId}`;
    if (!attemptsMap.has(key)) {
      attemptsMap.set(key, []);
    }
    attemptsMap.get(key)!.push(attempt);
  }

  // 4. Transform into GradebookEntry[]
  const gradebook: GradebookEntry[] = enrollments.map((enrollment) => {
    const student = enrollment.user;
    const studentQuizzes = quizzes.map((quiz) => {
      const attempts = attemptsMap.get(`${student.id}-${quiz.id}`) || [];

      // Calculate effective score for each attempt to find the best one
      const attemptsWithEffectiveScore = attempts.map((a) => ({
        ...a,
        effectiveScore: a.override ? a.override.newScore : a.score,
      }));

      // Sort by effective score desc
      attemptsWithEffectiveScore.sort(
        (a, b) => b.effectiveScore - a.effectiveScore,
      );

      const bestAttempt = attemptsWithEffectiveScore[0] || null;

      return {
        quizId: quiz.id,
        quizTitle: quiz.title,
        bestScore: bestAttempt ? bestAttempt.effectiveScore : null,
        bestAttemptId: bestAttempt?.id || null,
        // Recompute passed status based on effective score
        passed: bestAttempt
          ? bestAttempt.effectiveScore >= quiz.passingScore
          : null,
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
  data: { newScore: number; reason: string | null; teacherId: string },
) {
  // Validate score bounds
  if (data.newScore < 0 || data.newScore > 100) {
    throw new Error("Score must be between 0 and 100");
  }

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
      reason: data.reason || null,
    },
    create: {
      quizAttemptId: attemptId,
      originalScore: attempt.score,
      newScore: data.newScore,
      reason: data.reason || null,
      createdBy: data.teacherId,
    },
  });
}
 
