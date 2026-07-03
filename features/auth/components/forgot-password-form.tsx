"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import { toast } from "sonner";
import z from "zod";
import { ForgotPasswordSchema } from "@/features/auth/schemas/reset-password";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROUTES } from "@/features/auth/utils/routes";
import { submitPasswordResetRequest } from "@/features/auth/actions/client-actions";
import { Mail, ArrowLeft } from "lucide-react";

type ForgotInputValues = z.input<typeof ForgotPasswordSchema>;

export function ForgotPasswordForm() {
  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInputValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: ForgotInputValues) => {
    const result = await submitPasswordResetRequest(data.email);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message || "Request sent successfully!");
    reset();
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Enter your email address and we will send you a link to reset your password.
        </Typography>

        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          <TextField
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            size="medium"
            fullWidth
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} style={{ opacity: 0.6 }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
          >
            {isSubmitting ? "Sending Request..." : "Send Reset Link"}
          </Button>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <Typography
              component={Link}
              href={ROUTES.AUTH_LOGIN}
              variant="body2"
              color="primary"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                textDecoration: "none",
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              <ArrowLeft size={16} />
              Back to Login
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
