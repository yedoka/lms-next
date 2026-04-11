import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withRole } from "@/lib/auth/with-role";
import { ROLE } from "@/lib/auth/roles";

export default async function StudentDashboardPage() {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Area</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This area is available to students and admins. Enrollment and learner
          experiences from LMS-008 and LMS-009 can be added here.
        </p>
      </CardContent>
    </Card>
  );
}
