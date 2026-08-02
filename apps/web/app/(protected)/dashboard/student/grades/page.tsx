import { auth } from "@/auth";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { ROUTES } from "@/features/auth/utils/routes";
import { getStudentGrades } from "@/features/courses/services/student-grades-service";
import { StudentGradesTable } from "@/features/courses/components/student-grades-table";
import { ClipboardList, Percent, CheckCircle2 } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { PageContainer, PageHeader, EmptyState, StatCard } from "@/shared/components/ui";

export default async function StudentGradesPage() {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const { courses, averageScore, passedCount, attemptedCount, totalQuizzes } =
    await getStudentGrades(session.user.id);

  return (
    <PageContainer>
      <PageHeader
        title="My Grades"
        description="Every quiz score across your courses, including teacher regrades."
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
          icon={<Percent />}
          label="Average Score"
          value={averageScore !== null ? `${averageScore}%` : "—"}
          color="info"
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Quizzes Passed"
          value={`${passedCount}/${totalQuizzes}`}
          color="success"
        />
        <StatCard
          icon={<ClipboardList />}
          label="Quizzes Attempted"
          value={`${attemptedCount}/${totalQuizzes}`}
          color="default"
        />
      </Box>

      {courses.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="No grades yet"
          description="Enroll in a course and complete a quiz to see your scores here."
          action={
            <Button variant="contained" href={ROUTES.COURSES}>
              Browse Catalog
            </Button>
          }
        />
      ) : (
        <StudentGradesTable courses={courses} />
      )}
    </PageContainer>
  );
}
