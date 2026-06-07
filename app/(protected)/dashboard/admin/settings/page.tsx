import { PageContainer, PageHeader } from "@/shared/components/ui";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function AdminSettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="System Settings"
        description="Configure platform-wide parameters and features."
      />

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            Configuration
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Global site settings and preferences.
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
              System configuration module is under development.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

