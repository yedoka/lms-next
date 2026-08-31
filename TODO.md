# TODO

## Live quiz: don't reveal correctness immediately

`live-quiz-player.tsx:291-321` shows "Correct!"/"Wrong answer" + points to the
student right after they submit, before the question closes / teacher
advances. Bad for a live quiz - signals the answer to students still
deciding, kills the race-against-time tension.

Fix: withhold `isCorrect`/points from the student until the question closes
(teacher advances or timer ends), then reveal.

Touches:
- `apps/web/features/courses/hooks/use-live-session.ts` (`onAnswerReceived`,
  `lastAnswer` state)
- `apps/web/features/courses/components/live-quiz-player.tsx` (answer
  feedback block)
- realtime server: whatever currently emits `isCorrect`/points to the student
  socket on submit - check apps/realtime for the grader/emit site

## Thesis: replace screenshot after the fix

Once the reveal-timing fix ships, the live-quiz-player screenshot/figure in
the thesis will show the old immediate-feedback behavior. Retake and swap it
in `akedil-aidyn-diploma-thesis2.md`.

## Thesis: monospace pass for code/paths

Wrap every code identifier, function call, filename, and path in monospace
(backticks) throughout the thesis - both what's already written and
everything written from here on. Examples already fixed as models:
`proxy.ts`, `auth()`, `requireAuth()`, `validateCourseOwnership()`,
`features/auth/utils/with-role.ts`. Do a full pass over the existing text
(e.g. `shared/lib/publish-notification.ts` currently unformatted) rather than
relying on catching it going forward.
