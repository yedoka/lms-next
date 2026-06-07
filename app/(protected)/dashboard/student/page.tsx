import { auth } from "@/auth";
import { getStudentDashboardData } from "@/features/courses/services/progress-service";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { BookOpen, GraduationCap, Clock } from "lucide-react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { ROUTES } from "@/features/auth/utils/routes";
import { EnrolledCourseCard } from "@/features/courses/components/enrolled-course-card";
import { PageContainer, PageHeader, EmptyState, StatCard } from "@/shared/components/ui";

export default async function StudentDashboardPage() {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const dashboardData = await getStudentDashboardData(session.user.id);
  const enrolledCount = dashboardData.length;

  const totalCompletedLessons = dashboardData.reduce(
    (acc, course) => acc + course.completedCount,
    0,
  );

  const activeCourse = dashboardData.find(
    (c) => c.progressPercentage > 0 && c.progressPercentage < 100,
  );

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${session.user.name}!`}
        description="Track your progress and continue your learning journey."
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 3,
          mb: 5,
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
          icon={<Clock />}
          label="Active Now"
          value={activeCourse ? activeCourse.title : "None"}
          color="default"
        />
      </Box>

      <Box>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Your Courses
        </Typography>
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
            {dashboardData.map((course) => (
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
