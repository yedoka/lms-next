/**
 * A teacher regrade is stored in the `QuizOverride` sidecar table — it never
 * mutates `QuizAttempt.score` / `QuizAttempt.passed`, which keep the values the
 * auto-grader produced.
 *
 * That means every user-facing read must resolve the override, or it silently
 * reports the pre-override score. Use these helpers rather than reading
 * `attempt.score` / `attempt.passed` directly.
 */

export type ScoredAttempt = {
  score: number;
  override?: { newScore: number } | null;
};

export function getEffectiveScore(attempt: ScoredAttempt): number {
  return attempt.override ? attempt.override.newScore : attempt.score;
}

export function hasPassed(
  attempt: ScoredAttempt,
  passingScore: number,
): boolean {
  return getEffectiveScore(attempt) >= passingScore;
}

/**
 * Highest attempt by effective score. Cannot be expressed as an
 * `orderBy: { score: "desc" }, take: 1` query, because the score that ranks the
 * attempts may live in the override row.
 *
 * Ties resolve to the most recently submitted attempt; unsubmitted (in
 * progress) attempts rank last.
 */
export function getBestAttempt<
  T extends ScoredAttempt & { submittedAt?: Date | null },
>(attempts: readonly T[]): T | null {
  let best: T | null = null;

  for (const attempt of attempts) {
    if (best === null) {
      best = attempt;
      continue;
    }

    const difference = getEffectiveScore(attempt) - getEffectiveScore(best);

    if (difference > 0) {
      best = attempt;
      continue;
    }

    if (difference === 0) {
      const candidateAt = attempt.submittedAt?.getTime() ?? -Infinity;
      const bestAt = best.submittedAt?.getTime() ?? -Infinity;

      if (candidateAt > bestAt) best = attempt;
    }
  }

  return best;
}
