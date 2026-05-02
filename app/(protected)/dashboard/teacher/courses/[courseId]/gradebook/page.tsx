import { auth } from "@/auth";
import { getCourseGradebook } from "@/features/courses/services/gradebook-service";
import { validateCourseOwnership } from "@/features/courses/utils/auth";
import { notFound, redirect } from "next/navigation";
import { GradebookTable } from "@/features/courses/components/gradebook-table";
import { Button } from "@/shared/ui/button";
import {
  Download,
  ChevronLeft,
  BarChart3,
  Users,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

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
      .filter((s): s is number => s !== null),
  );
  const averageScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href={`/dashboard/teacher/courses/${courseId}/lessons`}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Course
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Gradebook</h2>
          <p className="text-muted-foreground">
            Monitor student progress and manage quiz scores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <a href={`/api/courses/${courseId}/gradebook/export`} download>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/40 bg-muted/30 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-muted/30 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Quizzes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuizzes}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-muted/30 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>
      </div>

      <GradebookTable
        courseId={courseId}
        gradebook={gradebook}
        quizzes={quizzes}
      />
    </div>
  );
}
