import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { PageContainer, PageHeader } from "@/shared/components/ui";
import { getSettings } from "@/features/admin/services/settings-service";
import { SystemSettingsForm } from "@/features/admin/components/SystemSettingsForm";
import { BroadcastDialog } from "@/features/admin/components/BroadcastDialog";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";

export default async function AdminSettingsPage() {
  await withRole(ROLE.ADMIN);

  const settings = await getSettings();

  return (
    <PageContainer>
      <PageHeader
        title="System Settings"
        description="Configure platform-wide parameters and features."
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <BroadcastDialog />
      </Box>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <SystemSettingsForm defaultValues={settings} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
