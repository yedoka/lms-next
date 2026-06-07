"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { ROUTES } from "@/features/auth/utils/routes";

export default function ForbiddenPage() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        bgcolor: "background.default",
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              color: "error.main",
              mb: 2,
              display: "flex",
              justifyContent: "center",
              "& svg": { width: 48, height: 48 },
            }}
          >
            <ShieldX />
          </Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            Access Denied
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            403 — Forbidden
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You are signed in, but your role does not have permission to view
            this page. This area is restricted to specific roles.
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            flexWrap="wrap"
          >
            <Button
              component={Link}
              href={ROUTES.DASHBOARD}
              variant="contained"
              sx={{ bgcolor: "#191919", "&:hover": { bgcolor: "#333" } }}
            >
              Go to Dashboard
            </Button>
            <Button
              component={Link}
              href={ROUTES.AUTH_LOGIN}
              variant="outlined"
              sx={{ borderColor: "#191919", color: "#191919", "&:hover": { borderColor: "#333", bgcolor: "action.hover" } }}
            >
              Switch Account
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
