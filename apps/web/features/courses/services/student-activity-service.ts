import prisma from "@/shared/db/prisma";
import { getEffectiveScore } from "@/features/courses/utils/effective-score";

export interface WeeklyActivityPoint {
  /** Monday of the week, as YYYY-MM-DD. */
  week: string;
  lessons: number;
  quizzes: number;
}

export type ActivityEventKind = "lesson_completed" | "quiz_submitted" | "regrade";

export interface ActivityEvent {
  id: string;
  kind: ActivityEventKind;
  at: Date;
  title: string;
  /** Course title for lessons, quiz score for attempts, override reason for regrades. */
  detail: string | null;
  href: string | null;
}

/**
 * Lessons completed and quizzes submitted per ISO week. Weeks with no activity
 * are returned as zeroes — a chart that skips them misreports the gaps as
 * shorter than they were.
 */
export async function getStudentActivityOverTime(
  userId: string,
  weeks = 12,
): Promise<WeeklyActivityPoint[]> {
  const cutoff = startOfWeek(new Date());
  cutoff.setUTCDate(cutoff.getUTCDate() - (weeks - 1) * 7);

  const [lessonRows, quizRows] = await Promise.all([
    prisma.$queryRaw<{ week: Date; count: number }[]>`
      SELECT date_trunc('week', "completedAt") AS week, COUNT(*)::int AS count
      FROM "LessonProgress"
      WHERE "userId" = ${userId}
        AND "isCompleted" = true
        AND "completedAt" >= ${cutoff}
      GROUP BY week
      ORDER BY week ASC
    `,
    prisma.$queryRaw<{ week: Date; count: number }[]>`
      SELECT date_trunc('week', "submittedAt") AS week, COUNT(*)::int AS count
      FROM "QuizAttempt"
      WHERE "userId" = ${userId}
        AND "submittedAt" >= ${cutoff}
      GROUP BY week
      ORDER BY week ASC
    `,
  ]);

  const lessonMap = new Map(
    lessonRows.map((row) => [toDateKey(new Date(row.week)), row.count]),
  );
  const quizMap = new Map(
    quizRows.map((row) => [toDateKey(new Date(row.week)), row.count]),
  );

  const points: WeeklyActivityPoint[] = [];

  for (let i = 0; i < weeks; i++) {
    const week = new Date(cutoff);
    week.setUTCDate(cutoff.getUTCDate() + i * 7);
    const key = toDateKey(week);

    points.push({
      week: key,
      lessons: lessonMap.get(key) ?? 0,
      quizzes: quizMap.get(key) ?? 0,
    });
  }

  return points;
}

/**
 * Lesson completions, quiz submissions and teacher regrades merged into one
 * reverse-chronological stream. The three sources are queried separately and
 * merged in application code — a SQL UNION would have to flatten three
 * different shapes into one row type.
 */
export async function getStudentActivityFeed(
  userId: string,
  limit = 20,
): Promise<ActivityEvent[]> {
  const [lessons, attempts, overrides] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId, isCompleted: true, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: limit,
      select: {
        id: true,
        completedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: { select: { title: true } },
          },
        },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: limit,
      select: {
        id: true,
        score: true,
        submittedAt: true,
        override: { select: { newScore: true } },
        quiz: {
          select: {
            title: true,
            passingScore: true,
            lesson: { select: { id: true, courseId: true } },
          },
        },
      },
    }),
    prisma.quizOverride.findMany({
      where: { attempt: { userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        originalScore: true,
        newScore: true,
        reason: true,
        createdAt: true,
        creator: { select: { name: true } },
        attempt: {
          select: {
            id: true,
            quiz: {
              select: {
                title: true,
                lesson: { select: { id: true, courseId: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const events: ActivityEvent[] = [
    ...lessons.map((progress) => ({
      id: `lesson-${progress.id}`,
      kind: "lesson_completed" as const,
      at: progress.completedAt!,
      title: progress.lesson.title,
      detail: progress.lesson.course.title,
      href: lessonHref(progress.lesson.courseId, progress.lesson.id),
    })),
    ...attempts.map((attempt) => {
      const score = getEffectiveScore(attempt);

      return {
        id: `attempt-${attempt.id}`,
        kind: "quiz_submitted" as const,
        at: attempt.submittedAt!,
        title: attempt.quiz.title,
        detail: `Scored ${score}% (pass mark ${attempt.quiz.passingScore}%)`,
        href: `${lessonHref(attempt.quiz.lesson.courseId, attempt.quiz.lesson.id)}/quiz/results/${attempt.id}`,
      };
    }),
    ...overrides.map((override) => ({
      id: `override-${override.id}`,
      kind: "regrade" as const,
      at: override.createdAt,
      title: override.attempt.quiz.title,
      detail: `${override.originalScore}% → ${override.newScore}%${
        override.creator?.name ? ` by ${override.creator.name}` : ""
      }${override.reason ? ` — ${override.reason}` : ""}`,
      href: `${lessonHref(
        override.attempt.quiz.lesson.courseId,
        override.attempt.quiz.lesson.id,
      )}/quiz/results/${override.attempt.id}`,
    })),
  ];

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}

function lessonHref(courseId: string, lessonId: string) {
  return `/courses/${courseId}/lessons/${lessonId}`;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Monday 00:00 UTC of the week containing `date`. Computed in UTC on purpose:
 * Prisma stores these columns as UTC timestamps and `date_trunc('week', ...)`
 * buckets them in UTC, so a local-midnight boundary here would shift the keys
 * off the query results by a day for anyone east or west of UTC.
 */
function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  const dayOfWeek = (result.getUTCDay() + 6) % 7; // Monday = 0
  result.setUTCDate(result.getUTCDate() - dayOfWeek);
  return result;
}
