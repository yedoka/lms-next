import { auth } from "@/auth";
import { getStudentCourses } from "@/features/courses/services/service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import Link from "next/link";
import { ROUTES } from "@/features/auth/utils/routes";

export default async function StudentCoursesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const courses = await getStudentCourses(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground">
          Manage and continue your learning progress.
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Courses</CardTitle>
            <CardDescription>You are currently enrolled in 0 courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              <div className="text-center">
                <p>No courses found.</p>
                <Link 
                  href={ROUTES.COURSES} 
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  Browse the catalog to get started
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.id} href={ROUTES.COURSE_DETAILS(course.id)}>
              <Card className="h-full hover:shadow-lg transition flex flex-col overflow-hidden">
                <div className="aspect-video relative bg-slate-100 overflow-hidden">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <CardHeader className="flex-none p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{course.category || "Uncategorized"}</Badge>
                    <span className="text-xs text-muted-foreground">{course._count.lessons} Lessons</span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="mt-auto p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    By {course.teacher?.name || "Unknown Teacher"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
