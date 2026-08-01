import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import prisma from "@/shared/db/prisma";
import { redirect } from "next/navigation";
import { QuizBuilder } from "@/features/courses/components/quiz-builder";
import { StartLiveSessionButton } from "@/features/courses/components/start-live-session-button";
import { PageContainer } from "@/shared/components/ui";
import Box from "@mui/material/Box";

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
    <PageContainer>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <StartLiveSessionButton
          href={`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}/quiz/live`}
          disabled={!quiz.isPublished}
        />
      </Box>
      <QuizBuilder quiz={quiz} courseId={courseId} />
    </PageContainer>
  );
}
