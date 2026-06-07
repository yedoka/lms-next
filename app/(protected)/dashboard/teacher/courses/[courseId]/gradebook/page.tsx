import { auth } from "@/auth";
import { getCourseGradebook } from "@/features/courses/services/gradebook-service";
import { validateCourseOwnership } from "@/features/courses/utils/auth";
import { notFound, redirect } from "next/navigation";
import { GradebookTable } from "@/features/courses/components/gradebook-table";
import { Download, ChevronLeft, BarChart3, Users, BookOpen } from "lucide-react";
import { PageContainer, PageHeader, StatCard } from "@/shared/components/ui";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

export default async function GradebookPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  try {
    await validateCourseOwnership(courseId, session.user.id, session.user.role);
  } catch {
    return notFound();
  }

  const { gradebook, quizzes } = await getCourseGradebook(courseId);

  // Calculate summary stats
  const totalStudents = gradebook.length;
  const totalQuizzes = quizzes.length;

  // Calculate average score across all students and all quizzes
  const allScores = gradebook.flatMap((entry) =>
    entry.quizzes
      .map((q) => q.bestScore)
      .filter((s): s is number => s !== null)
  );
  const averageScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

  return (
    <PageContainer>
      {/* Back button */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Button
          href={`/dashboard/teacher/courses/${courseId}/edit`}
          variant="text"
          size="small"
          startIcon={<ChevronLeft size={16} />}
          sx={{ color: "text.secondary", p: 0.5 }}
        >
          Back to Course Setup
        </Button>
      </Stack>

      <PageHeader
        title="Gradebook"
        description="Monitor student progress and manage quiz scores."
        actions={
          <Button
            href={`/api/courses/${courseId}/gradebook/export`}
            download
            variant="outlined"
            size="small"
            startIcon={<Download size={16} />}
          >
            Export CSV
          </Button>
        }
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        <StatCard
          icon={<Users size={20} />}
          label="Total Students"
          value={totalStudents}
          color="info"
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Active Quizzes"
          value={totalQuizzes}
          color="default"
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Average Score"
          value={`${averageScore}%`}
          color="success"
        />
      </Box>

      <GradebookTable
        courseId={courseId}
        gradebook={gradebook}
        quizzes={quizzes}
      />
    </PageContainer>
  );
}

