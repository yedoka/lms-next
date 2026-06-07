import { PageContainer, PageHeader } from "@/shared/components/ui";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function UserSettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            Profile Settings
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Update your personal information.
          </Typography>

          <Box
            sx={{
              display: "flex",
              height: 200,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Account settings are coming soon.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

