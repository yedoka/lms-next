import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ROLE } from "@/features/auth/utils/roles";
import { ROLE_LABELS } from "@/features/auth/utils/rbac";
import { ROUTES } from "@/features/auth/utils/routes";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.AUTH_LOGIN);
  }

  const role = session.user.role;

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>You are signed in as {ROLE_LABELS[role]}.</p>
          <p>Open a role-scoped area to verify RBAC access boundaries.</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          asChild
          variant={role === ROLE.STUDENT ? "default" : "outline"}
        >
          <Link href={ROUTES.DASHBOARD_STUDENT}>Student Area</Link>
        </Button>
        <Button
          asChild
          variant={role === ROLE.TEACHER ? "default" : "outline"}
        >
          <Link href={ROUTES.DASHBOARD_TEACHER}>Teacher Area</Link>
        </Button>
        <Button
          asChild
          variant={role === ROLE.ADMIN ? "default" : "outline"}
        >
          <Link href={ROUTES.DASHBOARD_ADMIN}>Admin Area</Link>
        </Button>
      </div>
    </section>
  );
}
