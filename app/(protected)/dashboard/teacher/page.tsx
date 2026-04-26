import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { CourseTable } from "@/features/courses/components/course-table";
import { getTeacherCourses } from "@/features/courses/services/service";

export default async function TeacherDashboardPage() {
  const session = await withRole([ROLE.TEACHER, ROLE.ADMIN]);
  const courses = await getTeacherCourses(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <Link href="/dashboard/teacher/courses/create">
          <Button>Create Course</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseTable courses={courses} />
        </CardContent>
      </Card>
    </div>
  );
}
