import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import prisma from "@/shared/db/prisma";
import { redirect } from "next/navigation";
import { LiveQuizHost } from "@/features/courses/components/live-quiz-host";
import { PageContainer } from "@/shared/components/ui";

export default async function LiveQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await requireAuth();

  if (session.user.role !== ROLE.TEACHER && session.user.role !== ROLE.ADMIN) {
    redirect("/forbidden");
  }

  const quiz = await prisma.quiz.findFirst({
    where: {
      lessonId,
      lesson: {
        courseId,
        course: {
          teacherId:
            session.user.role === ROLE.ADMIN ? undefined : session.user.id,
        },
      },
      isPublished: true,
    },
    select: { id: true, title: true },
  });

  if (!quiz) {
    redirect(
      `/dashboard/teacher/courses/${courseId}/lessons/${lessonId}/quiz`,
    );
  }

  return (
    <PageContainer maxWidth="lg">
      <LiveQuizHost
        courseId={courseId}
        lessonId={lessonId}
        quizId={quiz.id}
        quizTitle={quiz.title}
      />
    </PageContainer>
  );
}
