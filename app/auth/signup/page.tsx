import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import { GraduationCap } from "lucide-react";
import { SignupForm } from "@/features/auth/components/signup-form";
import { getSettings } from "@/features/admin/services/settings-service";
import { ROUTES } from "@/features/auth/utils/routes";

export default async function Page() {
  const { platformName, allowSelfRegistration } = await getSettings();

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
        {allowSelfRegistration ? (
          <SignupForm />
        ) : (
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Registration is currently closed
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                New account registration has been disabled by the administrator.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <MuiLink href={ROUTES.AUTH_LOGIN} variant="body2" fontWeight={600}>
                  Log in
                </MuiLink>
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
