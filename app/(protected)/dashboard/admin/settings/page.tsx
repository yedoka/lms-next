import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide parameters and features.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Global site settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            System configuration module is under development.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
