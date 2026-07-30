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
  // Sorting alone changes no counts, so the result line only appears once the
  // list is actually narrower than the full set.
  const filtering = isFiltered(filters) && visible.length !== courses.length;

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
