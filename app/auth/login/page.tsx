import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSettings } from "@/features/admin/services/settings-service";

export default async function Page() {
  const { platformName } = await getSettings();

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100svh",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 3, md: 5 },
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center", mb: 3 }}>
          <GraduationCap size={28} color="var(--mui-palette-primary-main)" />
          <Typography variant="h6" fontWeight={700} color="primary">
            {platformName}
          </Typography>
        </Box>
        <LoginForm />
      </Box>
    </Box>
  );
}
