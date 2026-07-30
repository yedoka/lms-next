import { Suspense } from "react";
import prisma from "@/shared/db/prisma";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { courseOrderBy } from "@/features/courses/utils/course-sort";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import { PageContainer, PageHeader, EmptyState } from "@/shared/components/ui";
import { CourseFilters } from "@/features/courses/components/course-filters";

async function CourseList({
  searchParams,
}: {
  searchParams: { title?: string; category?: string; sort?: string };
}) {
  const { title, category, sort } = searchParams;

  const session = await auth();

  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      // Searching the description too, so a query like "docker" still finds a
      // course whose title words it in another way.
      ...(title
        ? {
            OR: [
              { title: { contains: title, mode: "insensitive" as const } },
              { description: { contains: title, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(category ? { category: { equals: category } } : {}),
    },
    include: {
      teacher: true,
      _count: {
        select: { lessons: true },
      },
    },
    orderBy: courseOrderBy(sort),
  });

  const enrolledCourseIds = session?.user?.id
    ? new Set(
        (
          await prisma.enrollment.findMany({
            where: {
              userId: session.user.id,
              courseId: { in: courses.map((course) => course.id) },
            },
            select: { courseId: true },
          })
        ).map((enrollment) => enrollment.courseId),
      )
    : new Set<string>();

  if (courses.length === 0) {
    return (
      <EmptyState
        title="No courses found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" },
        gap: 3,
      }}
    >
      {courses.map((course) => {
        const isEnrolled = enrolledCourseIds.has(course.id);

        return (
        <Link
          key={course.id}
          href={`/courses/${course.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Card
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transform: "translateY(-1px)",
              },
              transition: "box-shadow 0.15s, transform 0.15s",
            }}
          >
            <Box
              sx={{
                position: "relative",
                paddingTop: "56.25%",
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              {course.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.disabled",
                  }}
                >
                  <Typography variant="body2">No Image</Typography>
                </Box>
              )}

              {isEnrolled && (
                <Chip
                  icon={<CheckCircle2 size={14} />}
                  label="Enrolled"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "background.paper",
                    fontWeight: 600,
                    "& .MuiChip-icon": { color: "success.main" },
                  }}
                />
              )}
            </Box>
            <CardContent
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Chip
                  label={course.category || "Uncategorized"}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {course._count.lessons} Lessons
                </Typography>
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {course.title}
              </Typography>
              <Box
                sx={{
                  mt: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary" noWrap>
                  By {course.teacher?.name || "Unknown Teacher"}
                </Typography>
                {isEnrolled && (
                  <Typography
                    variant="body2"
                    color="primary"
                    fontWeight={600}
                    sx={{ flexShrink: 0 }}
                  >
                    Continue →
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Link>
        );
      })}
    </Box>
  );
}

function CourseGridSkeleton() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" },
        gap: 3,
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <Box sx={{ position: "relative", paddingTop: "56.25%" }}>
            <Skeleton
              variant="rectangular"
              sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
          </Box>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Skeleton width="40%" height={24} />
              <Skeleton width="25%" height={20} />
            </Box>
            <Skeleton width="80%" height={24} sx={{ mb: 0.5 }} />
            <Skeleton width="50%" height={20} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;

  const coursesWithCategories = await prisma.course.findMany({
    where: { isPublished: true },
    select: { category: true },
    distinct: ["category"],
  });

  const categories = coursesWithCategories
    .map((c) => c.category)
    .filter((c): c is string => !!c);

  return (
    <PageContainer>
      <PageHeader
        title="Course Catalog"
        actions={<CourseFilters categories={categories} />}
      />
      <Suspense key={JSON.stringify(params)} fallback={<CourseGridSkeleton />}>
        <CourseList searchParams={params} />
      </Suspense>
    </PageContainer>
  );
}
