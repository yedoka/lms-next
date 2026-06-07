"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import z from "zod";
import { LoginSchema } from "@/features/auth/schemas/login";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROUTES } from "@/features/auth/utils/routes";
import { submitLogin } from "@/features/auth/actions/client-actions";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

type LoginInputValues = z.input<typeof LoginSchema>;

const GoogleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ marginRight: 8 }}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInputValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginInputValues) => {
    const result = await submitLogin({
      ...data,
      rememberMe: !!data.rememberMe,
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Login successful!");
    reset();
    router.push(ROUTES.HOME);
    router.refresh();
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Login to your account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Enter your email below to login to your account
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

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            size="medium"
            fullWidth
            {...register("password")}
            error={!!errors.password}
            helperText={
              errors.password?.message ??
              "Must be at least 8 characters and include one number."
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} style={{ opacity: 0.6 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <FormControlLabel
              control={<Checkbox {...register("rememberMe")} size="small" />}
              label={
                <Typography variant="body2" sx={{ userSelect: "none" }}>
                  Remember me
                </Typography>
              }
            />
            <Typography
              component={Link}
              href="/forgot-password"
              variant="body2"
              color="primary"
              sx={{
                textDecoration: "none",
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Forgot password?
            </Typography>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", my: 1 }}>
            <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, fontWeight: 500 }}>
              OR
            </Typography>
            <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
          </Box>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            disabled={isSubmitting}
            type="button"
            startIcon={<GoogleIcon />}
            sx={{
              borderColor: "divider",
              color: "text.primary",
              "&:hover": {
                borderColor: "text.primary",
                bgcolor: "action.hover",
              },
            }}
          >
            Login with Google
          </Button>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Don&apos;t have an account?{" "}
            <Typography
              component={Link}
              href={ROUTES.AUTH_SIGNUP}
              variant="body2"
              color="primary"
              sx={{
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Sign up
            </Typography>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
