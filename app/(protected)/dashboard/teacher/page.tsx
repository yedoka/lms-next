import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withRole } from "@/lib/auth/with-role";
import { ROLE } from "@/lib/auth/roles";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CourseTable } from "@/components/courses/course-table";
import { getTeacherCourses } from "@/lib/courses/service";

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
