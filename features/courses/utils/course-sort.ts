import type { Prisma } from "@prisma/client";

export const COURSE_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "title", label: "Title A–Z" },
  { value: "lessons", label: "Most lessons" },
] as const;

export type CourseSort = (typeof COURSE_SORTS)[number]["value"];

export const DEFAULT_COURSE_SORT: CourseSort = "newest";

const ORDER_BY: Record<CourseSort, Prisma.CourseOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  title: { title: "asc" },
  lessons: { lessons: { _count: "desc" } },
};

/**
 * The sort key arrives from the query string, so an unknown value falls back to
 * the default rather than reaching Prisma.
 */
export function courseOrderBy(
  sort: string | undefined,
): Prisma.CourseOrderByWithRelationInput {
  return ORDER_BY[(sort ?? "") as CourseSort] ?? ORDER_BY[DEFAULT_COURSE_SORT];
}
