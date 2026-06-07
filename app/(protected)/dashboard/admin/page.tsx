import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { PageContainer, PageHeader } from "@/shared/components/ui";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default async function AdminDashboardPage() {
  await withRole(ROLE.ADMIN);

  return (
    <PageContainer>
      <PageHeader
        title="Admin Area"
        description="Global platform administration dashboard."
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page is restricted to admins. User and course management screens
            for LMS-005 can be expanded here.
          </Typography>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

