import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getQuizAttemptById } from "@/features/courses/services/quiz-service";
import { QuizResults } from "@/features/courses/components/quiz-results";

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string; attemptId: string }>;
}) {
  const { courseId, lessonId, attemptId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const attempt = await getQuizAttemptById(attemptId, session.user.id);

  if (!attempt) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <QuizResults
        courseId={courseId}
        lessonId={lessonId}
        attempt={attempt as any}
      />
    </div>
  );
}
