import { auth } from "@/auth";
import prisma from "@/shared/db/prisma";
import { notFound, redirect } from "next/navigation";
import { QuizPlayer } from "@/features/courses/components/quiz-player";
import { PageContainer } from "@/shared/components/ui";
import { startAttemptWindow } from "@/features/courses/services/quiz-attempt-window";

type QuizData = {
  id: string;
  title: string;
  timeLimit: number | null;
  questions: {
    id: string;
    text: string;
    type: "MULTIPLE_CHOICE" | "BOOLEAN";
    answers: { id: string; text: string }[];
  }[];
};

export default async function StudentQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const quiz = await prisma.quiz.findFirst({
    where: {
      lessonId,
      isPublished: true,
      lesson: {
        courseId,
      },
    },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          answers: {
            select: { id: true, text: true }, // Exclude isCorrect
          },
        },
      },
    },
  });

  if (!quiz) {
    return notFound();
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  const isTeacher = await prisma.course
    .findUnique({ where: { id: courseId }, select: { teacherId: true } })
    .then((c) => c?.teacherId === session.user.id);
  const isAdmin = session.user.role === "ADMIN";

  if (!enrollment && !isTeacher && !isAdmin) {
    redirect(`/courses/${courseId}`);
  }

  // Serving this page is what starts the attempt. The call is idempotent, so a
  // reload resumes the same countdown instead of restarting it, and the client
  // timer is driven by this server deadline rather than its own fresh clock.
  const startedAt = await startAttemptWindow(session.user.id, quiz.id, quiz.timeLimit);
  const deadline = quiz.timeLimit
    ? startedAt + quiz.timeLimit * 60 * 1000
    : null;

  return (
    <PageContainer maxWidth="md">
      <QuizPlayer
        courseId={courseId}
        lessonId={lessonId}
        quiz={quiz as QuizData}
        deadline={deadline}
      />
    </PageContainer>
  );
}
