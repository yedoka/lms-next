import Box from "@mui/material/Box";
import { SignupForm } from "@/features/auth/components/signup-form";

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
        <SignupForm />
      </Box>
    </Box>
  );
}
