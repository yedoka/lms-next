export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import prisma from "@/shared/db/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CourseSidebar, SidebarSkeleton } from "@/features/courses/components/course-sidebar";
import { LessonContent, ContentSkeleton } from "@/features/courses/components/lesson-content";
import Box from "@mui/material/Box";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  // Also allow teacher of the course or admin
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });

  const isTeacher = course?.teacherId === userId;
  const isAdmin = session.user.role === "ADMIN";

  if (!enrollment && !isTeacher && !isAdmin) {
    redirect(`/courses/${courseId}`);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, height: "100%" }}>
      {/* Sidebar */}
      <Suspense fallback={<SidebarSkeleton />}>
        <CourseSidebar courseId={courseId} lessonId={lessonId} userId={userId} />
      </Suspense>

      {/* Main Content */}
      <Suspense fallback={<ContentSkeleton />}>
        <LessonContent courseId={courseId} lessonId={lessonId} userId={userId} />
      </Suspense>
    </Box>
  );
}
