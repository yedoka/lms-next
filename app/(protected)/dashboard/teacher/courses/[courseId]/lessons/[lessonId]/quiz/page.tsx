import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import prisma from "@/shared/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { QuizBuilder } from "@/features/courses/components/quiz-builder";
import { PageContainer } from "@/shared/components/ui";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";

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
        <Tooltip title={!quiz.isPublished ? "Publish the quiz first to host a live session" : ""}>
          <span>
            {quiz.isPublished ? (
              <Link href={`/dashboard/teacher/courses/${courseId}/lessons/${lessonId}/quiz/live`} passHref legacyBehavior>
                <Button variant="contained" color="error" component="a">
                  Start Live Session
                </Button>
              </Link>
            ) : (
              <Button variant="contained" color="error" disabled>
                Start Live Session
              </Button>
            )}
          </span>
        </Tooltip>
      </Box>
      <QuizBuilder quiz={quiz} courseId={courseId} lessonId={lessonId} />
    </PageContainer>
  );
}
