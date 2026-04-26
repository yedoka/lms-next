import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import prisma from "@/shared/db/prisma";
import { CourseForm } from "@/features/courses/components/course-form";
import { redirect } from "next/navigation";
import { LessonList } from "@/features/courses/components/lesson-list";
import { AddLessonButton } from "@/features/courses/components/add-lesson-button";

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
      },
    },
  });

  if (!course) {
    redirect("/dashboard/teacher");
  }

  if (course.teacherId !== session.user.id && session.user.role !== ROLE.ADMIN) {
    redirect("/forbidden");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-medium">Course setup</h1>
          <span className="text-sm text-slate-700">
            Customize your course and lessons
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        <div>
          <div className="flex items-center gap-x-2 mb-4">
            <h2 className="text-xl">Course Details</h2>
          </div>
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
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl">Course Lessons</h2>
              <AddLessonButton courseId={courseId} />
            </div>
            <LessonList 
              items={course.lessons} 
              courseId={courseId} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
