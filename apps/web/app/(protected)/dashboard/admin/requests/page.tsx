import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { PageContainer, PageHeader } from "@/shared/components/ui";
import { getPendingRequests } from "@/features/admin/services/role-request-service";
import { RoleRequestTable } from "@/features/admin/components/RoleRequestTable";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default async function AdminRoleRequestsPage() {
  await withRole(ROLE.ADMIN);

  const requests = await getPendingRequests();

  return (
    <PageContainer>
      <PageHeader
        title="Role Requests"
        description="Review and approve pending role upgrade requests."
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          <RoleRequestTable requests={requests} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
