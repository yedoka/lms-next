import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/features/auth/utils/routes";

export default function TeacherCoursesPage() {
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
          <CardDescription>You have created 0 courses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            You haven't created any courses yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
