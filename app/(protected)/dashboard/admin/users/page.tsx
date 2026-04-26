import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all users in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>A list of all users and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            User list is currently unavailable.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
