import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import { GraduationCap, Wrench } from "lucide-react";
import { getSettings } from "@/features/admin/services/settings-service";

export default async function MaintenancePage() {
  const { platformName } = await getSettings();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100svh",
        textAlign: "center",
        p: { xs: 3, md: 5 },
        bgcolor: "background.default",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <GraduationCap size={32} color="var(--mui-palette-primary-main)" />
        <Typography variant="h5" fontWeight={700} color="primary">
          {platformName}
        </Typography>
      </Box>

      <Wrench size={48} color="var(--mui-palette-warning-main)" />

      <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
        Under Maintenance
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
        {platformName} is temporarily down for scheduled maintenance. We'll be
        back shortly.
      </Typography>

      <Button component={Link} href="/auth/login" variant="outlined" sx={{ mt: 2 }}>
        Admin login
      </Button>
    </Box>
  );
}
