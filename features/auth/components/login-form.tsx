"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import z from "zod";
import { LoginSchema } from "@/features/auth/schemas/login";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROUTES } from "@/features/auth/utils/routes";
import { submitLogin } from "@/features/auth/actions/client-actions";

type LoginInputValues = z.input<typeof LoginSchema>;

export function LoginForm() {
  const router = useRouter();

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
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Login to your account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your email below to login to your account
        </Typography>

        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
          <TextField
            label="Email"
            type="email"
            placeholder="m@example.com"
            size="small"
            fullWidth
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                Password
              </Typography>
              <Typography
                component={Link}
                href="/forgot-password"
                variant="caption"
                color="info.main"
                sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Forgot your password?
              </Typography>
            </Box>
            <TextField
              type="password"
              size="small"
              fullWidth
              {...register("password")}
              error={!!errors.password}
              helperText={
                errors.password?.message ??
                "Must be at least 8 characters and include one number."
              }
            />
          </Box>

          <FormControlLabel
            control={<Checkbox {...register("rememberMe")} size="small" />}
            label={
              <Typography variant="body2">Remember me for 30 days</Typography>
            }
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
          >
            Login
          </Button>

          <Button
            variant="outlined"
            fullWidth
            disabled={isSubmitting}
            type="button"
          >
            Login with Google
          </Button>

          <Typography variant="body2" color="text.secondary" align="center">
            Don&apos;t have an account?{" "}
            <Typography
              component={Link}
              href={ROUTES.AUTH_SIGNUP}
              variant="body2"
              color="info.main"
              sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              Sign up
            </Typography>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
