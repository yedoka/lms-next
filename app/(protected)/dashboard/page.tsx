import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
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
        <Button asChild variant={role === "STUDENT" ? "default" : "outline"}>
          <Link href="/dashboard/student">Student Area</Link>
        </Button>
        <Button asChild variant={role === "TEACHER" ? "default" : "outline"}>
          <Link href="/dashboard/teacher">Teacher Area</Link>
        </Button>
        <Button asChild variant={role === "ADMIN" ? "default" : "outline"}>
          <Link href="/dashboard/admin">Admin Area</Link>
        </Button>
      </div>
    </section>
  );
}
