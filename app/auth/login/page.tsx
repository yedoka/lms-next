import Box from "@mui/material/Box";
import { LoginForm } from "@/features/auth/components/login-form";

export default function Page() {
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
        <LoginForm />
      </Box>
    </Box>
  );
}
