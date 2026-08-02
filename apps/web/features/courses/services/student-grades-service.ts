import prisma from "@/shared/db/prisma";
import {
  getBestAttempt,
  getEffectiveScore,
  hasPassed,
} from "@/features/courses/utils/effective-score";

export interface StudentAttemptGrade {
  attemptId: string;
  /** Score the auto-grader produced. Differs from `score` when a teacher regraded. */
  originalScore: number;
  /** Score that counts — the override value when one exists. */
  score: number;
  passed: boolean;
  submittedAt: Date | null;
  isBest: boolean;
  override: {
    reason: string | null;
    teacherName: string | null;
    createdAt: Date;
  } | null;
}

export interface StudentQuizGrade {
  quizId: string;
  quizTitle: string;
  lessonId: string;
  lessonTitle: string;
  passingScore: number;
  /** Effective score of the best attempt; null when never attempted. */
  bestScore: number | null;
  bestAttemptId: string | null;
  passed: boolean | null;
  attempts: StudentAttemptGrade[];
}

export interface StudentCourseGrades {
  courseId: string;
  courseTitle: string;
  quizzes: StudentQuizGrade[];
  /** Average of best scores over attempted quizzes only; null when nothing attempted. */
  averageScore: number | null;
  attemptedCount: number;
  passedCount: number;
  totalQuizzes: number;
}

export interface StudentGradesSummary {
  courses: StudentCourseGrades[];
  averageScore: number | null;
  passedCount: number;
  attemptedCount: number;
  totalQuizzes: number;
}

/**
 * Every graded quiz across the student's enrolled courses, with the full attempt
 * history and any teacher regrade (reason included) surfaced to the student.
 */
export async function getStudentGrades(
  userId: string,
): Promise<StudentGradesSummary> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              quizzes: {
                where: { isPublished: true },
                select: {
                  id: true,
                  title: true,
                  passingScore: true,
                  attempts: {
                    where: { userId, submittedAt: { not: null } },
                    orderBy: { submittedAt: "desc" },
                    include: {
                      override: {
                        select: {
                          newScore: true,
                          reason: true,
                          createdAt: true,
                          creator: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const courses: StudentCourseGrades[] = enrollments.map((enrollment) => {
    const quizzes: StudentQuizGrade[] = enrollment.course.lessons.flatMap(
      (lesson) =>
        lesson.quizzes.map((quiz) => {
          const best = getBestAttempt(quiz.attempts);

          const attempts: StudentAttemptGrade[] = quiz.attempts.map(
            (attempt) => ({
              attemptId: attempt.id,
              originalScore: attempt.score,
              score: getEffectiveScore(attempt),
              passed: hasPassed(attempt, quiz.passingScore),
              submittedAt: attempt.submittedAt,
              isBest: attempt.id === best?.id,
              override: attempt.override
                ? {
                    reason: attempt.override.reason,
                    teacherName: attempt.override.creator?.name ?? null,
                    createdAt: attempt.override.createdAt,
                  }
                : null,
            }),
          );

          return {
            quizId: quiz.id,
            quizTitle: quiz.title,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            passingScore: quiz.passingScore,
            bestScore: best ? getEffectiveScore(best) : null,
            bestAttemptId: best?.id ?? null,
            passed: best ? hasPassed(best, quiz.passingScore) : null,
            attempts,
          };
        }),
    );

    const attempted = quizzes.filter((quiz) => quiz.bestScore !== null);
    const passedCount = attempted.filter((quiz) => quiz.passed).length;

    return {
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      quizzes,
      averageScore: averageOf(attempted.map((quiz) => quiz.bestScore!)),
      attemptedCount: attempted.length,
      passedCount,
      totalQuizzes: quizzes.length,
    };
  });

  const allAttemptedScores = courses.flatMap((course) =>
    course.quizzes
      .filter((quiz) => quiz.bestScore !== null)
      .map((quiz) => quiz.bestScore!),
  );

  return {
    courses,
    averageScore: averageOf(allAttemptedScores),
    passedCount: courses.reduce((acc, course) => acc + course.passedCount, 0),
    attemptedCount: allAttemptedScores.length,
    totalQuizzes: courses.reduce((acc, course) => acc + course.totalQuizzes, 0),
  };
}

function averageOf(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length);
}
