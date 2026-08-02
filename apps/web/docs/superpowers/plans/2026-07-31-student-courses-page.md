# Student "My Courses" Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/dashboard/student/courses` from a bare course grid into a filterable course manager with progress stats, and demote the duplicate grid on `/dashboard/student` to a 4-course preview.

**Architecture:** The page stays a Server Component. It reads `searchParams`, parses them with Zod into a filter object, loads enrolled courses via the existing `getStudentDashboardData()` (three queries, no N+1), computes summary stats from the full list, then applies pure in-memory filter/sort functions before rendering the existing `EnrolledCourseCard`. A small client component writes tab/search/sort back into the URL, mirroring the pattern already used by the public catalog's `CourseFilters`.

**Tech Stack:** Next.js 16 App Router (React 19, React Compiler), TypeScript, MUI v6, Zod v4, Prisma v7, NextAuth v5, lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-07-31-student-courses-page-design.md`

**Testing note:** This repo has no test runner (`package.json` has no `test` script, no vitest/jest). Adding one is out of scope for this change. Verification per task is therefore: TypeScript compile via `yarn build`, `yarn lint`, and — for UI tasks — a scripted manual walkthrough with exact expected results. Every task below states exactly what to run and what to see.

**Commit note:** `.gitignore:43` ignores `*.md`, so plan and spec files cannot be committed without `-f`. Do not force-add them. Only source files get committed.

---

### Task 1: Pure filter/sort/summary utilities

All filtering logic lives in one pure module with no Prisma or React imports, so it can be reasoned about (and later tested) in isolation.

**Files:**
- Create: `features/courses/utils/enrolled-course-filters.ts`

- [ ] **Step 1: Create the module**

```ts
import { z } from "zod";

/**
 * Shape this module operates on. Structurally a subset of what
 * getStudentDashboardData() returns, so that service can evolve without
 * dragging the filter logic along.
 */
export interface EnrolledCourseLike {
  courseId: string;
  title: string;
  category: string | null;
  teacherName: string;
  totalLessons: number;
  completedCount: number;
  progressPercentage: number;
  lastActivityAt: Date | null;
}

export const ENROLLED_TABS = [
  { value: "all", label: "All" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "not-started", label: "Not Started" },
] as const;

export type EnrolledTab = (typeof ENROLLED_TABS)[number]["value"];

export const ENROLLED_SORTS = [
  { value: "recent", label: "Recent activity" },
  { value: "title", label: "Title A–Z" },
  { value: "progress", label: "Most progress" },
] as const;

export type EnrolledSort = (typeof ENROLLED_SORTS)[number]["value"];

export const DEFAULT_ENROLLED_TAB: EnrolledTab = "all";
export const DEFAULT_ENROLLED_SORT: EnrolledSort = "recent";

export type CourseStatus = "completed" | "in-progress" | "not-started";

export interface EnrolledFilters {
  tab: EnrolledTab;
  q: string;
  sort: EnrolledSort;
}

export interface EnrolledSummary {
  enrolled: number;
  inProgress: number;
  completed: number;
  averageBestScore: number | null;
}

/**
 * A course with no published lessons has 0% progress but must not read as
 * "completed", so the lesson count is checked before the percentage.
 */
export function courseStatus(course: EnrolledCourseLike): CourseStatus {
  if (course.totalLessons > 0 && course.progressPercentage === 100) {
    return "completed";
  }
  if (course.completedCount === 0) {
    return "not-started";
  }
  return "in-progress";
}

const filterSchema = z.object({
  tab: z.enum(["all", "in-progress", "completed", "not-started"]).catch(DEFAULT_ENROLLED_TAB),
  q: z.string().max(100).catch("").transform((value) => value.trim()),
  sort: z.enum(["recent", "title", "progress"]).catch(DEFAULT_ENROLLED_SORT),
});

/**
 * Search params arrive from the URL, so anything unparseable falls back to the
 * default instead of throwing. Repeated params (?tab=a&tab=b) collapse to the
 * first value, matching how the filter bar writes them.
 */
export function parseEnrolledFilters(
  params: Record<string, string | string[] | undefined>,
): EnrolledFilters {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  return filterSchema.parse({
    tab: first(params.tab),
    q: first(params.q) ?? "",
    sort: first(params.sort),
  });
}

export function applyEnrolledFilters<T extends EnrolledCourseLike>(
  courses: T[],
  filters: EnrolledFilters,
): T[] {
  const needle = filters.q.toLowerCase();

  const filtered = courses.filter((course) => {
    if (filters.tab !== "all" && courseStatus(course) !== filters.tab) {
      return false;
    }
    if (needle === "") {
      return true;
    }
    return [course.title, course.teacherName, course.category ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case "title":
        return a.title.localeCompare(b.title);
      case "progress":
        return b.progressPercentage - a.progressPercentage;
      case "recent":
      default:
        // Courses with no activity yet sort last rather than first.
        return (
          (b.lastActivityAt?.getTime() ?? -Infinity) -
          (a.lastActivityAt?.getTime() ?? -Infinity)
        );
    }
  });
}

export function summarizeEnrolled(
  courses: (EnrolledCourseLike & { bestQuizScore: number | null })[],
): EnrolledSummary {
  const scored = courses.filter((course) => course.bestQuizScore !== null);

  return {
    enrolled: courses.length,
    inProgress: courses.filter((c) => courseStatus(c) === "in-progress").length,
    completed: courses.filter((c) => courseStatus(c) === "completed").length,
    averageBestScore:
      scored.length > 0
        ? Math.round(
            scored.reduce((acc, c) => acc + (c.bestQuizScore ?? 0), 0) /
              scored.length,
          )
        : null,
  };
}

export function isFiltered(filters: EnrolledFilters): boolean {
  return (
    filters.tab !== DEFAULT_ENROLLED_TAB ||
    filters.q !== "" ||
    filters.sort !== DEFAULT_ENROLLED_SORT
  );
}
```

- [ ] **Step 2: Type-check the new module**

Run: `yarn lint`
Expected: no errors mentioning `enrolled-course-filters.ts`. (Warnings elsewhere in the repo are pre-existing and out of scope.)

- [ ] **Step 3: Sanity-check the pure functions by hand**

Create a scratch file `scratch-filters.ts` at the repo root:

```ts
import {
  applyEnrolledFilters,
  courseStatus,
  parseEnrolledFilters,
  summarizeEnrolled,
} from "./features/courses/utils/enrolled-course-filters";

const courses = [
  { courseId: "a", title: "Algebra", category: "Math", teacherName: "Ann", totalLessons: 4, completedCount: 4, progressPercentage: 100, lastActivityAt: new Date("2026-07-01"), bestQuizScore: 90 },
  { courseId: "b", title: "Biology", category: "Science", teacherName: "Bob", totalLessons: 4, completedCount: 2, progressPercentage: 50, lastActivityAt: new Date("2026-07-20"), bestQuizScore: 70 },
  { courseId: "c", title: "Chemistry", category: null, teacherName: "Cid", totalLessons: 0, completedCount: 0, progressPercentage: 0, lastActivityAt: null, bestQuizScore: null },
];

console.log(courses.map(courseStatus).join(",")); // completed,in-progress,not-started
console.log(parseEnrolledFilters({ tab: "bogus", sort: undefined, q: "  x " })); // tab all, sort recent, q "x"
console.log(applyEnrolledFilters(courses, { tab: "all", q: "", sort: "recent" }).map((c) => c.courseId).join(",")); // b,a,c
console.log(applyEnrolledFilters(courses, { tab: "all", q: "ann", sort: "title" }).map((c) => c.courseId).join(",")); // a
console.log(summarizeEnrolled(courses)); // enrolled 3, inProgress 1, completed 1, averageBestScore 80
```

Run: `npx tsx scratch-filters.ts`
Expected output, in order:

```
completed,in-progress,not-started
{ tab: 'all', q: 'x', sort: 'recent' }
b,a,c
a
{ enrolled: 3, inProgress: 1, completed: 1, averageBestScore: 80 }
```

If any line differs, fix `enrolled-course-filters.ts` — not the scratch file — and re-run.

- [ ] **Step 4: Delete the scratch file**

```bash
rm scratch-filters.ts
```

- [ ] **Step 5: Commit**

```bash
git add features/courses/utils/enrolled-course-filters.ts
git commit -m "feat(courses): add pure filter and summary utils for enrolled courses"
```

---

### Task 2: Filter bar client component

**Files:**
- Create: `features/courses/components/enrolled-course-filters.tsx`
- Reference (same pattern, do not modify): `features/courses/components/course-filters.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { useDebounce } from "@/shared/lib/hooks";
import {
  DEFAULT_ENROLLED_SORT,
  DEFAULT_ENROLLED_TAB,
  ENROLLED_SORTS,
  ENROLLED_TABS,
} from "../utils/enrolled-course-filters";

export function EnrolledCourseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebounce(query, 500);

  const write = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(window.location.search);
    mutate(params);
    const search = params.toString();
    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    });
  };

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get("q") ?? "";
    if (debouncedQuery === current) {
      return;
    }
    write((params) => {
      if (debouncedQuery) {
        params.set("q", debouncedQuery);
      } else {
        params.delete("q");
      }
    });
    // `write` is stable enough for this effect: it only reads refs from hooks
    // that never change identity across renders of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, pathname, router]);

  const setParam = (key: string, value: string, clearWhen: string) =>
    write((params) => {
      if (value && value !== clearWhen) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

  const tab = searchParams.get("tab") ?? DEFAULT_ENROLLED_TAB;
  const activeTab = ENROLLED_TABS.some((t) => t.value === tab)
    ? tab
    : DEFAULT_ENROLLED_TAB;

  const sort = searchParams.get("sort") ?? DEFAULT_ENROLLED_SORT;
  const activeSort = ENROLLED_SORTS.some((s) => s.value === sort)
    ? sort
    : DEFAULT_ENROLLED_SORT;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
        borderBottom: 1,
        borderColor: "divider",
        pb: 2,
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, value: string) =>
          setParam("tab", value, DEFAULT_ENROLLED_TAB)
        }
        variant="scrollable"
        scrollButtons={false}
        sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40 } }}
      >
        {ENROLLED_TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search your courses..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          value={activeSort}
          onChange={(event) =>
            setParam("sort", event.target.value, DEFAULT_ENROLLED_SORT)
          }
          sx={{ minWidth: 180 }}
        >
          {ENROLLED_SORTS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Lint**

Run: `yarn lint`
Expected: no errors mentioning `enrolled-course-filters.tsx`.

- [ ] **Step 3: Commit**

```bash
git add features/courses/components/enrolled-course-filters.tsx
git commit -m "feat(courses): add URL-driven filter bar for enrolled courses"
```

---

### Task 3: Rewrite the My Courses page

**Files:**
- Modify (full rewrite): `app/(protected)/dashboard/student/courses/page.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { auth } from "@/auth";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { ROUTES } from "@/features/auth/utils/routes";
import { getStudentDashboardData } from "@/features/courses/services/progress-service";
import {
  applyEnrolledFilters,
  isFiltered,
  parseEnrolledFilters,
  summarizeEnrolled,
} from "@/features/courses/utils/enrolled-course-filters";
import { EnrolledCourseFilters } from "@/features/courses/components/enrolled-course-filters";
import { EnrolledCourseCard } from "@/features/courses/components/enrolled-course-card";
import { BookOpen, CheckCircle2, PlayCircle, Percent, SearchX } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatCard,
} from "@/shared/components/ui";

interface StudentCoursesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentCoursesPage({
  searchParams,
}: StudentCoursesPageProps) {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [filters, courses] = await Promise.all([
    searchParams.then(parseEnrolledFilters),
    getStudentDashboardData(session.user.id),
  ]);

  // Stats describe the whole enrollment set, so they stay stable while the
  // student narrows the list below.
  const stats = summarizeEnrolled(courses);
  const visible = applyEnrolledFilters(courses, filters);
  const filtering = isFiltered(filters);

  return (
    <PageContainer>
      <PageHeader
        title="My Courses"
        description={
          stats.enrolled === 0
            ? "Manage and continue your learning progress."
            : `${stats.enrolled} enrolled · ${stats.inProgress} in progress · ${stats.completed} completed`
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No courses yet"
          description="You aren't enrolled in any courses. Browse the catalog to start learning."
          action={
            <Button variant="contained" href={ROUTES.COURSES}>
              Browse Catalog
            </Button>
          }
        />
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
              mb: 4,
            }}
          >
            <StatCard
              icon={<BookOpen />}
              label="Enrolled"
              value={stats.enrolled}
              color="info"
            />
            <StatCard
              icon={<PlayCircle />}
              label="In Progress"
              value={stats.inProgress}
              color="warning"
            />
            <StatCard
              icon={<CheckCircle2 />}
              label="Completed"
              value={stats.completed}
              color="success"
            />
            <StatCard
              icon={<Percent />}
              label="Avg Best Score"
              value={
                stats.averageBestScore !== null
                  ? `${stats.averageBestScore}%`
                  : "—"
              }
              color="default"
            />
          </Box>

          <EnrolledCourseFilters />

          {filtering && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {visible.length} of {courses.length} courses
              </Typography>
              <Button
                size="small"
                href={ROUTES.DASHBOARD_STUDENT_COURSES}
                sx={{ textTransform: "none" }}
              >
                Clear filters
              </Button>
            </Box>
          )}

          {visible.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="No courses match your filters"
              description="Try a different tab or search term."
              action={
                <Button
                  variant="outlined"
                  href={ROUTES.DASHBOARD_STUDENT_COURSES}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                  xl: "repeat(4, 1fr)",
                },
              }}
            >
              {visible.map((course) => (
                <EnrolledCourseCard key={course.courseId} {...course} />
              ))}
            </Box>
          )}
        </>
      )}
    </PageContainer>
  );
}
```

- [ ] **Step 2: Confirm the `EmptyState` API matches**

Run: `cat shared/components/ui/empty-state.tsx`
Expected: props `icon`, `title`, `description`, `action` — the same set used above and already used by the current page. If a prop name differs, adjust the calls above to match the real component; do not change `EmptyState`.

- [ ] **Step 3: Lint and build**

Run: `yarn lint && yarn build`
Expected: build succeeds; no type errors in `app/(protected)/dashboard/student/courses/page.tsx`.

- [ ] **Step 4: Manual walkthrough**

Run `yarn dev`, sign in as a seeded student, open `http://localhost:3000/dashboard/student/courses`, and confirm each of:

1. Four stat cards appear above the filter bar with non-placeholder numbers.
2. Clicking **In Progress** puts `?tab=in-progress` in the URL and the grid shows only partially-completed courses.
3. Typing a course title in search updates the URL to `?tab=in-progress&q=...` after ~0.5s and narrows the grid.
4. Typing gibberish (`zzzz`) shows the "No courses match your filters" empty state with a Clear filters button that returns to the unfiltered page.
5. Switching sort to **Title A–Z** reorders the grid alphabetically and sets `?sort=title`.
6. Browser Back returns to the previous filter state with the grid matching it.
7. Stat card numbers do **not** change while filtering.
8. Visiting `/dashboard/student/courses?tab=nonsense&sort=nonsense` renders the unfiltered page instead of erroring.

- [ ] **Step 5: Commit**

```bash
git add "app/(protected)/dashboard/student/courses/page.tsx"
git commit -m "feat(courses): rebuild student My Courses page with stats and filters"
```

---

### Task 4: Demote the dashboard course grid to a preview

**Files:**
- Modify: `app/(protected)/dashboard/student/page.tsx` (the "Your Courses" `<Box>` section near the end of the JSX)

- [ ] **Step 1: Add the slice constant**

Directly above `const enrolledCount = dashboardData.length;` add:

```tsx
  // The full, filterable list lives at /dashboard/student/courses; the dashboard
  // only previews the most recently active courses.
  const PREVIEW_COURSE_COUNT = 4;
```

- [ ] **Step 2: Replace the "Your Courses" section header**

Replace:

```tsx
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Your Courses
        </Typography>
```

with:

```tsx
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            gap: 2,
          }}
        >
          <Typography variant="h5" component="h2">
            Your Courses
          </Typography>
          {dashboardData.length > PREVIEW_COURSE_COUNT && (
            <Button
              href={ROUTES.DASHBOARD_STUDENT_COURSES}
              size="small"
              sx={{ textTransform: "none", flexShrink: 0 }}
            >
              View all {dashboardData.length} →
            </Button>
          )}
        </Box>
```

- [ ] **Step 3: Slice the grid**

Replace:

```tsx
            {dashboardData.map((course) => (
              <EnrolledCourseCard key={course.courseId} {...course} />
            ))}
```

with:

```tsx
            {dashboardData
              .slice(0, PREVIEW_COURSE_COUNT)
              .map((course) => (
                <EnrolledCourseCard key={course.courseId} {...course} />
              ))}
```

- [ ] **Step 4: Lint and build**

Run: `yarn lint && yarn build`
Expected: build succeeds. `Button` and `ROUTES` are already imported in this file, so no import changes are needed — if the build reports either as undefined, add the missing import.

- [ ] **Step 5: Manual check**

Open `http://localhost:3000/dashboard/student` as a student with 5+ enrollments.
Expected: at most 4 course cards; a "View all N →" button beside the "Your Courses" heading that navigates to `/dashboard/student/courses`. With 4 or fewer enrollments the button is absent. With zero enrollments the existing empty state still renders.

- [ ] **Step 6: Commit**

```bash
git add "app/(protected)/dashboard/student/page.tsx"
git commit -m "refactor(dashboard): preview four courses and link to full list"
```

---

### Task 5: Remove the now-unused service function

**Files:**
- Modify: `features/courses/services/service.ts:20-47` (`getStudentCourses`)

- [ ] **Step 1: Find remaining callers**

Run: `grep -rn "getStudentCourses" --include=*.ts --include=*.tsx app features shared`
Expected: no matches. Task 3 removed the only caller.

If any match exists outside `service.ts`, **stop and skip this entire task** — leave the function in place and note it in the final report.

- [ ] **Step 2: Delete the function**

Delete lines 20–47 of `features/courses/services/service.ts` — the whole `export async function getStudentCourses(userId: string) { ... }` block, including its leading doc comment if one is attached to it. Leave every other export untouched.

- [ ] **Step 3: Lint and build**

Run: `yarn lint && yarn build`
Expected: build succeeds with no "cannot find name" errors.

- [ ] **Step 4: Commit**

```bash
git add features/courses/services/service.ts
git commit -m "chore(courses): drop unused getStudentCourses service"
```

---

### Task 6: Final verification pass

**Files:** none modified.

- [ ] **Step 1: Clean build**

Run: `yarn lint && yarn build`
Expected: both succeed. Record the exact output if either fails; do not claim completion on a failing build.

- [ ] **Step 2: Zero-enrollment path**

Sign in as (or seed) a student with no enrollments and open `/dashboard/student/courses`.
Expected: the "No courses yet" empty state with a Browse Catalog button. No stat cards, no filter bar, no result line.

- [ ] **Step 3: Confirm the commit series**

Run: `git log --oneline -6`
Expected: the commits from Tasks 1–5 in order, and no `.md` files staged or committed.
