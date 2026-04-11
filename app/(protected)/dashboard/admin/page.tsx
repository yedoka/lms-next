import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withRole } from "@/lib/auth/with-role";
import { ROLE } from "@/lib/auth/roles";

export default async function AdminDashboardPage() {
  await withRole(ROLE.ADMIN);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Area</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This page is restricted to admins. User and course management screens
          for LMS-005 can be expanded here.
        </p>
      </CardContent>
    </Card>
  );
}
