import { auth } from "@/auth";
import { getStudentCourses } from "@/features/courses/services/service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { BookOpen, GraduationCap, Clock, Settings } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/features/auth/utils/routes";

export default async function StudentDashboardPage() {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const courses = await getStudentCourses(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session.user.name}!</h1>
        <p className="text-muted-foreground">
          Track your progress and continue your learning journey.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              Across various categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Keep going!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Recently accessed course
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.length > 0 ? (
                courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Joined {course.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ready to start learning
                      </p>
                    </div>
                    <Link 
                      href={ROUTES.COURSE_DETAILS(course.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent activity found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link 
              href={ROUTES.COURSES}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-accent"
            >
              <BookOpen className="h-4 w-4" />
              Browse Catalog
            </Link>
            <Link 
              href={ROUTES.DASHBOARD_STUDENT_COURSES}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-accent"
            >
              <GraduationCap className="h-4 w-4" />
              My Courses
            </Link>
            <Link 
              href={ROUTES.DASHBOARD_SETTINGS}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
              Account Settings
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
