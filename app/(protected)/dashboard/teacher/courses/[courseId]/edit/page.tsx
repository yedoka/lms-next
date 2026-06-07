import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import prisma from "@/shared/db/prisma";
import { CourseForm } from "@/features/courses/components/course-form";
import { redirect } from "next/navigation";
import { LessonList } from "@/features/courses/components/lesson-list";
import { AddLessonButton } from "@/features/courses/components/add-lesson-button";
import { PageContainer, PageHeader } from "@/shared/components/ui";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await requireAuth();

  if (session.user.role !== ROLE.TEACHER && session.user.role !== ROLE.ADMIN) {
    redirect("/forbidden");
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      lessons: {
        orderBy: {
          position: "asc",
        },
        include: {
          attachments: true,
          quizzes: true,
        },
      },
    },
  });

  if (!course) {
    redirect("/dashboard/teacher");
  }

  if (
    course.teacherId !== session.user.id &&
    session.user.role !== ROLE.ADMIN
  ) {
    redirect("/forbidden");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Course setup"
        description="Customize your course and lessons"
      />

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {/* Left side: Course details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Course Details
              </Typography>
              <CourseForm
                initialData={{
                  id: course.id,
                  title: course.title,
                  description: course.description || "",
                  category: course.category || "",
                  thumbnail: course.thumbnail || "",
                  isPublished: course.isPublished,
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right side: Lessons list */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Course Lessons
                </Typography>
                <AddLessonButton courseId={courseId} />
              </Box>
              <LessonList items={course.lessons} courseId={courseId} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

