import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export default function UserSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Account settings are coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
