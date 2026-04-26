import { requireAuth } from "@/lib/auth/with-role";
import { ROLE } from "@/lib/auth/roles";
import prisma from "@/lib/prisma";
import { CourseForm } from "@/components/courses/course-form";
import { redirect } from "next/navigation";

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
            Complete all fields
          </span>
        </div>
      </div>
      <div className="max-w-xl mt-8">
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
    </div>
  );
}
