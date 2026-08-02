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
