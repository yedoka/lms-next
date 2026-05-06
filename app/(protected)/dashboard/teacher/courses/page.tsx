import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/features/auth/utils/routes";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { getTeacherCourses } from "@/features/courses/services/service";
import { CourseTable } from "@/features/courses/components/course-table";

export default async function TeacherCoursesPage() {
  const session = await withRole([ROLE.TEACHER, ROLE.ADMIN]);
  const courses = await getTeacherCourses(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Courses</h1>
          <p className="text-muted-foreground">
            Create and manage your educational content.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.DASHBOARD_TEACHER_COURSE_CREATE}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
          <CardDescription>You have created {courses.length} course{courses.length === 1 ? '' : 's'}.</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseTable courses={courses} />
        </CardContent>
      </Card>
    </div>
  );
}
