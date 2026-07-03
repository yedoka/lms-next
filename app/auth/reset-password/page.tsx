import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import { GraduationCap, AlertCircle } from "lucide-react";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getSettings } from "@/features/admin/services/settings-service";
import { ROUTES } from "@/features/auth/utils/routes";

interface PageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { platformName } = await getSettings();
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

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

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <AlertCircle size={48} color="var(--mui-palette-error-main)" />
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                Invalid Reset Link
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This password reset link is missing a token or is invalid. Please request a new link.
              </Typography>
              <Link href={ROUTES.AUTH_FORGOT_PASSWORD} passHref style={{ textDecoration: "none" }}>
                <Button variant="contained" fullWidth>
                  Request New Link
                </Button>
              </Link>
              <Box sx={{ mt: 2 }}>
                <Link href={ROUTES.AUTH_LOGIN} style={{ textDecoration: "none" }}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 500, "&:hover": { textDecoration: "underline" } }}>
                    Back to Login
                  </Typography>
                </Link>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
