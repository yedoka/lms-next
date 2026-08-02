import { auth } from "@/auth";
import { getStudentDashboardData } from "@/features/courses/services/progress-service";
import {
  getStudentActivityFeed,
  getStudentActivityOverTime,
} from "@/features/courses/services/student-activity-service";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { BookOpen, GraduationCap, Percent } from "lucide-react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { ROUTES } from "@/features/auth/utils/routes";
import { EnrolledCourseCard } from "@/features/courses/components/enrolled-course-card";
import {
  ContinueLearningCard,
  type ContinueLearningTarget,
} from "@/features/courses/components/continue-learning-card";
import { StudentActivityChart } from "@/features/courses/components/student-activity-chart";
import { StudentActivityFeed } from "@/features/courses/components/student-activity-feed";
import { PageContainer, PageHeader, EmptyState, StatCard } from "@/shared/components/ui";

export default async function StudentDashboardPage() {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [dashboardData, activityPoints, activityEvents] = await Promise.all([
    getStudentDashboardData(session.user.id),
    getStudentActivityOverTime(session.user.id),
    getStudentActivityFeed(session.user.id),
  ]);

  // The full, filterable list lives at /dashboard/student/courses; the dashboard
  // only previews the most recently active courses.
  const PREVIEW_COURSE_COUNT = 4;

  const enrolledCount = dashboardData.length;

  const totalCompletedLessons = dashboardData.reduce(
    (acc, course) => acc + course.completedCount,
    0,
  );

  const scoredCourses = dashboardData.filter(
    (course) => course.bestQuizScore !== null,
  );
  const averageScore =
    scoredCourses.length > 0
      ? Math.round(
          scoredCourses.reduce((acc, c) => acc + c.bestQuizScore!, 0) /
            scoredCourses.length,
        )
      : null;

  const continueTarget = pickContinueTarget(dashboardData);

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${session.user.name}!`}
        description="Track your progress and continue your learning journey."
      />

      <ContinueLearningCard
        target={continueTarget}
        allCoursesComplete={enrolledCount > 0 && continueTarget === null}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 3,
          mb: 3,
        }}
      >
        <StatCard
          icon={<BookOpen />}
          label="Enrolled Courses"
          value={enrolledCount}
          color="info"
        />
        <StatCard
          icon={<GraduationCap />}
          label="Completed Lessons"
          value={totalCompletedLessons}
          color="success"
        />
        <StatCard
          icon={<Percent />}
          label="Average Best Score"
          value={averageScore !== null ? `${averageScore}%` : "—"}
          color="default"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          gap: 3,
          mb: 5,
        }}
      >
        <StudentActivityChart points={activityPoints} />
        <StudentActivityFeed events={activityEvents} />
      </Box>

      <Box>
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
        {dashboardData.length > 0 ? (
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
            {dashboardData
              .slice(0, PREVIEW_COURSE_COUNT)
              .map((course) => (
                <EnrolledCourseCard key={course.courseId} {...course} />
              ))}
          </Box>
        ) : (
          <EmptyState
            icon={<BookOpen />}
            title="No courses yet"
            description="You haven't enrolled in any courses. Browse the catalog to start learning."
            action={
              <Button variant="contained" href={ROUTES.COURSES}>
                Browse Catalog
              </Button>
            }
          />
        )}
      </Box>
    </PageContainer>
  );
}

type DashboardCourse = Awaited<
  ReturnType<typeof getStudentDashboardData>
>[number];

/**
 * The course to offer next: the one with an unfinished lesson that the student
 * touched most recently. Courses never started rank last but stay eligible, so
 * a fresh enrollment still gets a resume target.
 */
function pickContinueTarget(
  courses: DashboardCourse[],
): ContinueLearningTarget | null {
  const candidates = courses.filter(
    (course) => course.nextLessonId !== null && course.nextLessonTitle !== null,
  );

  if (candidates.length === 0) {
    return null;
  }

  const [best] = candidates.sort(
    (a, b) =>
      (b.lastActivityAt?.getTime() ?? -Infinity) -
      (a.lastActivityAt?.getTime() ?? -Infinity),
  );

  return {
    courseId: best.courseId,
    courseTitle: best.title,
    lessonId: best.nextLessonId!,
    lessonTitle: best.nextLessonTitle!,
    completedCount: best.completedCount,
    totalLessons: best.totalLessons,
    progressPercentage: best.progressPercentage,
  };
}
