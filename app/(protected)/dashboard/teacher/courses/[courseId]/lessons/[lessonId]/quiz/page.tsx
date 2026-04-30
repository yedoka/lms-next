import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import prisma from "@/shared/db/prisma";
import { redirect } from "next/navigation";
import { QuizBuilder } from "@/features/courses/components/quiz-builder";

export default async function QuizPage({
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
    },
    include: {
      questions: {
        orderBy: {
          position: "asc",
        },
        include: {
          answers: {
            orderBy: {
              id: "asc",
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    redirect(`/dashboard/teacher/courses/${courseId}/edit`);
  }

  return (
    <div className="p-6">
      <QuizBuilder quiz={quiz} courseId={courseId} lessonId={lessonId} />
    </div>
  );
}
