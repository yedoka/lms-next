import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ROUTES } from "@/features/auth/utils/routes";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>403 - Forbidden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            You are signed in, but your role does not have permission to view
            this page.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={ROUTES.DASHBOARD}>Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.AUTH_LOGIN}>Switch Account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
