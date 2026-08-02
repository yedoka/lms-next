import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { PageContainer, PageHeader } from "@/shared/components/ui";
import { getAllUsers } from "@/features/admin/services/admin-service";
import { UserTable } from "@/features/admin/components/UserTable";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Download } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await withRole(ROLE.ADMIN);

  const users = await getAllUsers();

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        description="View and manage all users in the system."
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
        <Button
          component="a"
          href="/api/admin/export?type=users"
          variant="outlined"
          size="small"
          startIcon={<Download size={16} />}
        >
          Export Users
        </Button>
        <Button
          component="a"
          href="/api/admin/export?type=enrollments"
          variant="outlined"
          size="small"
          startIcon={<Download size={16} />}
        >
          Export Enrollments
        </Button>
      </Box>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <UserTable users={users} currentUserId={session.user.id} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
