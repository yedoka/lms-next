# Student "My Courses" Page Redesign

Date: 2026-07-31
Target: `app/(protected)/dashboard/student/courses/page.tsx`

## Problem

The page renders a bare grid of enrolled courses — thumbnail, category chip, lesson
count, title, teacher. No progress, no filtering, no actions. It looks empty, and it
duplicates the "Your Courses" section on `/dashboard/student`, which shows strictly
more information via `EnrolledCourseCard` (progress bar, best quiz score, resume
button).

## Goal

Make `/dashboard/student/courses` the student's course *manager*: a complete,
filterable list with progress at a glance. `/dashboard/student` stays the *glance*:
recent courses only, with a link here. The page must read as engineered work, not
decoration — derived metrics, URL-driven state, pure testable filter logic.

## Layout

```
PageContainer
├─ PageHeader  "My Courses" · "N courses · M in progress"
├─ Stat strip (4 × StatCard, grid xs:1fr sm:2 md:4)
│    Enrolled | In Progress | Completed | Avg Best Score
├─ EnrolledCourseFilters (client)
│    [Tabs: All | In Progress | Completed | Not Started]  (?tab=)
│    [Search field ?q=]  [Sort select ?sort=]
├─ Result line: "Showing 4 of 9 courses" + "Clear filters" (only while filtered)
└─ Grid of EnrolledCourseCard (xs:1, sm:2, lg:3, xl:4)
```

`EnrolledCourseCard` is reused unchanged. No new card component.

## Data

Source becomes `getStudentDashboardData(userId)` from
`features/courses/services/progress-service.ts` — three queries, no N+1, and it
already returns `completedCount`, `totalLessons`, `progressPercentage`,
`nextLessonId`, `nextLessonTitle`, `bestQuizScore`, `lastActivityAt`.

```ts
export default async function StudentCoursesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);   // page currently lacks this guard
  const params = parseEnrolledFilters(await searchParams);
  const courses = await getStudentDashboardData(userId);
  const stats = summarizeEnrolled(courses);        // computed from the FULL list
  const visible = applyEnrolledFilters(courses, params);
}
```

Stats are derived before filtering so the numbers do not jump while the student
types in the search box.

### Status derivation

- `completed` — `progressPercentage === 100` **and** `totalLessons > 0`
- `notStarted` — `completedCount === 0`
- `inProgress` — everything else

A course with zero published lessons is `notStarted`, never `completed`.

### Search params

Parsed with Zod. Invalid values fall back to defaults; parsing never throws.

| Param  | Values | Default | Behavior |
|--------|--------|---------|----------|
| `tab`  | `all` \| `in-progress` \| `completed` \| `not-started` | `all` | Filters by derived status |
| `q`    | string, ≤100 chars | empty | Case-insensitive match on title, teacher name, category |
| `sort` | `recent` \| `title` \| `progress` | `recent` | `recent` = `lastActivityAt` desc, nulls last; `title` = A–Z; `progress` = percentage desc |

## Components

**New — `features/courses/utils/enrolled-course-filters.ts`** (pure, no Prisma import):
`ENROLLED_TABS`, `ENROLLED_SORTS`, `DEFAULT_ENROLLED_TAB`, `DEFAULT_ENROLLED_SORT`,
`courseStatus()`, `parseEnrolledFilters()`, `applyEnrolledFilters()`,
`summarizeEnrolled()`. Filtering happens in memory; the list is bounded by the
student's enrollment count.

**New — `features/courses/components/enrolled-course-filters.tsx`** (`"use client"`):
MUI `Tabs` + search `TextField` + sort `TextField select`. Mirrors the existing
`features/courses/components/course-filters.tsx` used by the public catalog, and
reuses `useDebounce` from `shared/lib/hooks` (500ms). Writes state with
`router.replace(pathname + query, { scroll: false })` and wraps navigation in
`useTransition` to dim the grid while the server re-renders.

**Changed — `app/(protected)/dashboard/student/page.tsx`**: the "Your Courses"
section slices to the 4 most recent courses and gains a `View all →` link to
`ROUTES.DASHBOARD_STUDENT_COURSES`. The empty state is unchanged.

**Removed — `getStudentCourses` in `features/courses/services/service.ts`**, if no
caller remains after the rewrite.

## Error handling and edge cases

- No enrollments: catalog `EmptyState`; the filter bar is not rendered at all.
- Filters match nothing: `EmptyState` "No courses match your filters" plus a
  Clear filters button that resets to `?tab=all`.
- Course with no published lessons: `progressPercentage` 0, status `notStarted`.
- Malformed search params: Zod defaults, no crash, no Prisma exposure.
- No quiz attempts anywhere: Avg Best Score renders `—`.
- Unauthenticated or wrong role: `withRole` redirects before any query runs.

## Verification

The repo has no test runner, so verification is lint, build, and a manual pass:

1. `yarn lint`
2. `yarn build`
3. Playwright walk of `/dashboard/student/courses`:
   - each tab filters correctly and the URL updates
   - search with a hit and with a miss (empty state appears)
   - each sort option reorders the grid
   - browser back restores the previous filter state
   - a student account with zero enrollments shows the catalog empty state
   - `/dashboard/student` shows at most 4 courses and the View all link works

## Out of scope

- Any change to `EnrolledCourseCard` itself.
- Per-course lesson checklists or deadline tracking.
- Recommendations or catalog content on this page.
