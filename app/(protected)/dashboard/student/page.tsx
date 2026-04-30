import { auth } from "@/auth";
import { getStudentDashboardData } from "@/features/courses/services/progress-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { BookOpen, GraduationCap, Clock } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/features/auth/utils/routes";
import { EnrolledCourseCard } from "@/features/courses/components/enrolled-course-card";

export default async function StudentDashboardPage() {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const dashboardData = await getStudentDashboardData(session.user.id);
  const enrolledCount = dashboardData.length;

  const totalCompletedLessons = dashboardData.reduce(
    (acc, course) => acc + course.completedCount,
    0,
  );

  const activeCourse = dashboardData.find(
    (c) => c.progressPercentage > 0 && c.progressPercentage < 100,
  );

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name}!
        </h1>
        <p className="text-muted-foreground">
          Track your progress and continue your learning journey.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCount}</div>
            <p className="text-xs text-muted-foreground">
              Across various categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Lessons
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedLessons}</div>
            <p className="text-xs text-muted-foreground">Keep going!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold line-clamp-1">
              {activeCourse ? activeCourse.title : "None"}
            </div>
            <p className="text-xs text-muted-foreground">
              Recently accessed course
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Your Courses</h2>
        {dashboardData.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dashboardData.map((course) => (
              <EnrolledCourseCard key={course.courseId} {...course} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No courses yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              You haven&apos;t enrolled in any courses. Browse the catalog to
              start learning.
            </p>
            <Link
              href={ROUTES.COURSES}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Browse Catalog
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
