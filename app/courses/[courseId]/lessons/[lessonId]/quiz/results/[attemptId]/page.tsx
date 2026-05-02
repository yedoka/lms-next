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

  if (
    !attempt ||
    attempt.quiz.lessonId !== lessonId ||
    attempt.quiz.lesson.courseId !== courseId
  ) {
    return notFound();
  }

  // Map to the exact prop shape for type safety and to minimize data passed to client
  const mappedAttempt = {
    score: attempt.score,
    passed: attempt.passed,
    quiz: {
      passingScore: attempt.quiz.passingScore,
      title: attempt.quiz.title,
    },
    answers: attempt.answers.map((a) => ({
      question: { text: a.question.text },
      answer: { text: a.answer.text, isCorrect: a.answer.isCorrect },
    })),
  };

  return (
    <div className="container mx-auto p-6">
      <QuizResults
        courseId={courseId}
        lessonId={lessonId}
        attempt={mappedAttempt}
      />
    </div>
  );
}
