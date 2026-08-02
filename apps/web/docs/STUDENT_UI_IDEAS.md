# Student UI — Feature Ideas & Implementation Notes

> Status: strategy A ("learning cockpit") is chosen and built — feature 0 and
> backlog items 1–4 and 6 are implemented. Items 5 and 7 are still proposals.

## Why this document exists

The student role is the thinnest surface in the app. Counting protected pages:

| Role    | Pages |
| ------- | ----- |
| Teacher | 8     |
| Admin   | 5     |
| Student | 3 (after feature 0) |

The gap is not missing data — it is unrendered data. `LessonProgress`,
`QuizAttempt`, `AttemptAnswer`, `QuizOverride` and `Notification` are all
populated by the seed and by normal use, but most of it never reaches a student
screen.

## Goal

Optimise for the **thesis defence demo**: maximum visible effect per unit of
work, and a demo that survives a flaky network in the room.

---

## 0. My Grades — implemented

`/dashboard/student/grades`. Per-course accordion listing every published quiz
with best score, pass state, attempt count and expandable attempt history.
Teacher regrades are shown explicitly (`original% → new%`, author, reason).

- `features/courses/services/student-grades-service.ts` — `getStudentGrades()`
- `features/courses/components/student-grades-table.tsx`
- `app/(protected)/dashboard/student/grades/page.tsx`
- `features/auth/utils/routes.ts` — `DASHBOARD_STUDENT_GRADES`
- `shared/lib/navigation.ts` — "My Grades" nav item

Scores resolve through `getEffectiveScore()` / `getBestAttempt()` from
`features/courses/utils/effective-score.ts`. Reading `attempt.score` directly
would report the pre-override value, because `QuizOverride` is a sidecar table
that never mutates `QuizAttempt`.

---

## Three strategies considered

### A. Learning cockpit — recommended base

Turn the student dashboard into a live control centre instead of three static
stat cards. No schema changes: `LessonProgress.completedAt` and
`QuizAttempt.submittedAt` already provide a time series.

Trade-off: guaranteed to work offline from Redis, one screen carries most of the
demo — but it is visually polished CRUD and does not showcase the architecture.

### B. Real-time showcase

Lean on the Socket.IO + Redis pub/sub layer that is already built and today only
reachable by a student through `/live?code=`. Two browser windows side by side:
the teacher clicks, the student's screen changes with no reload.

Trade-off: memorable and unusual for a diploma project — but the demo depends on
`skillbase-express` and Redis being up during the defence.

### C. Gamification (badges, streaks, certificates)

Rejected. Requires new Prisma models, migrations, seed data and award rules, and
the result on screen is another grid of cards. Worst effort-to-effect ratio of
the three.

### Recommendation

**A as the base, plus one slice of B (the live quiz leaderboard).** The cockpit
keeps the demo alive if the network fails; the leaderboard supplies a single
real-time "wow" moment without staking the whole scenario on it.

---

## Backlog

Ordered by effect-per-effort. "Data" = what already exists in the DB.

### 1. Continue learning card — implemented

Hero card above the stats. Resolves the first unfinished published lesson of
the course with the most recent activity (latest lesson completion or quiz
submission) and links straight to it. Replaces the "Active Now" stat card,
which printed a course title and did nothing with it; its slot now holds an
average best score derived from data the dashboard query already returned.

- `features/courses/components/continue-learning-card.tsx`
- `progress-service.ts` — added `nextLessonTitle` and `lastActivityAt`
- `app/(protected)/dashboard/student/page.tsx` — `pickContinueTarget()`

### 2. Weekly activity chart — implemented

Stacked bars: lessons completed and quizzes submitted per ISO week over 12
weeks. Modelled on `features/admin/components/AnalyticsCharts.tsx`.

- `features/courses/services/student-activity-service.ts` —
  `getStudentActivityOverTime()`, raw SQL `date_trunc('week', ...)`
- `features/courses/components/student-activity-chart.tsx`
- Empty weeks are emitted as zeroes, or the axis understates the gaps
- Week keys are built in UTC to match `date_trunc` on the stored UTC
  timestamps; local-midnight keys would drift a day off the query results

### 3. Activity feed — implemented

Reverse-chronological stream merging lesson completions, quiz submissions and
teacher regrades (with reason). Merged in application code rather than a SQL
UNION, which would have to flatten three row shapes into one.

- `student-activity-service.ts` — `getStudentActivityFeed()`, capped at 20
- `features/courses/components/student-activity-feed.tsx`

### 4. Notifications page — implemented

Full history with all/unread tabs and mark-all-read, at
`/dashboard/student/notifications`.

- `features/notifications/components/notification-list.tsx`
- `app/(protected)/dashboard/student/notifications/page.tsx`
- `getNotifications()` now takes a limit (was a hardcoded 20); the limit
  crosses the server-action boundary from client code, so it is validated and
  capped at 100
- Type labels extracted to `features/notifications/utils/type-labels.ts`,
  shared with the bell
- The page does **not** use `useNotifications()`. That hook calls
  `socket.disconnect()` on unmount, and the socket is a module singleton
  shared with the header bell — mounting a second consumer would kill the
  bell's live feed on navigation. The page reads the service in a Server
  Component instead; the bell keeps the real-time role.

### 5. Live quiz leaderboard (the slice of B)

The live quiz player joins by code but shows no social context. Add a lobby
participant list and a post-question leaderboard.

- `features/courses/components/live-quiz-player.tsx`,
  `features/courses/hooks/use-live-session.ts`
- Needs matching events in `skillbase-express`; ranking state lives in Redis with the
  session, not in Postgres
- Demo risk: requires the socket server and Redis to be running

### 6. Catalog sorting and enrolled state — implemented

Correction to the original entry: `course-filters.tsx` already had debounced
title search and a category filter. What was missing was sorting and any sign
of enrollment on a card.

- `features/courses/utils/course-sort.ts` — sort options and the `orderBy`
  lookup; the key comes from the query string, so an unknown value falls back
  to the default instead of reaching Prisma
- `course-filters.tsx` — sort select
- `app/courses/page.tsx` — "Enrolled" badge and Continue affordance, one
  enrollment query scoped to the courses on the page
- Title search now also matches `description`

### 7. Attempt review improvements

The results page handles one attempt in isolation. Link attempts to each other
so a student can compare a retake against the previous try, and show which
questions were answered wrong both times.

- Data: `AttemptAnswer` per attempt, `Answer.isCorrect`

### Not planned

- Certificates and badges — see strategy C
- Discussion threads / comments — new models, moderation surface, no payoff in a
  10-minute demo
