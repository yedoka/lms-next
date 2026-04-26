import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withRole } from "@/lib/auth/with-role";
import { ROLE } from "@/lib/auth/roles";

export default async function TeacherDashboardPage() {
  await withRole([ROLE.TEACHER, ROLE.ADMIN]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Area</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This area is available to teachers and admins. Course authoring
          controls from LMS-006 will be mounted here.
        </p>
      </CardContent>
    </Card>
  );
}
