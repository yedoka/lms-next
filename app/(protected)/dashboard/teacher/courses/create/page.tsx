import { requireAuth } from "@/lib/auth/with-role";
import { ROLE } from "@/lib/auth/roles";
import { CourseForm } from "@/components/courses/course-form";
import { redirect } from "next/navigation";

export default async function CreateCoursePage() {
  const session = await requireAuth();

  if (session.user.role !== ROLE.TEACHER && session.user.role !== ROLE.ADMIN) {
    redirect("/forbidden");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-medium">Name your course</h1>
          <p className="text-sm text-muted-foreground">
            What would you like to name your course? Don&apos;t worry, you can change this later.
          </p>
        </div>
      </div>
      <div className="max-w-xl mt-8">
        <CourseForm />
      </div>
    </div>
  );
}
