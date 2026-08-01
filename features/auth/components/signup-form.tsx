"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema } from "@/features/auth/schemas/signup";
import z from "zod";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/features/auth/utils/routes";
import { ROLE } from "@/features/auth/utils/roles";
import {
  autoSignInAfterSignup,
  submitSignup,
} from "@/features/auth/actions/client-actions";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

type SignupInput = z.infer<typeof SignupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      requestedRole: undefined,
      password: "",
      passwordConfirmation: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: SignupInput) => {
    const signupResult = await submitSignup(data);

    if (!signupResult.ok) {
      toast.error(signupResult.message);
      return;
    }

    const signInResult = await autoSignInAfterSignup(data.email, data.password);

    if (signInResult.ok) {
      toast.success("Account created. Welcome!");
      reset();
      router.push(ROUTES.HOME);
      router.refresh();
      return;
    }

    toast.success(signInResult.message);
    reset();
    router.push(ROUTES.AUTH_LOGIN);
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Create an account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Enter your information below to create your account
        </Typography>

        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          <TextField
            label="Full Name"
            placeholder="John Doe"
            size="medium"
            fullWidth
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <User size={18} style={{ opacity: 0.6 }} />
                  </InputAdornment>
                ),
              },
            }}
          />

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

          <FormControl error={!!errors.requestedRole} component="fieldset">
            <FormLabel
              component="legend"
              sx={{ typography: "body2", fontWeight: 500, mb: 1, color: "text.primary" }}
            >
              I am signing up as
            </FormLabel>
            <RadioGroup row>
              <FormControlLabel
                value={ROLE.STUDENT}
                control={<Radio size="medium" {...register("requestedRole")} />}
                label={<Typography variant="body2">Student</Typography>}
              />
              <FormControlLabel
                value={ROLE.TEACHER}
                control={<Radio size="medium" {...register("requestedRole")} />}
                label={<Typography variant="body2">Teacher</Typography>}
              />
            </RadioGroup>
            <FormHelperText>
              {errors.requestedRole?.message ??
                "Every account starts as a student. Choosing Teacher sends a request to an administrator for approval."}
            </FormHelperText>
          </FormControl>

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

          <TextField
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            size="medium"
            fullWidth
            {...register("passwordConfirmation")}
            error={!!errors.passwordConfirmation}
            helperText={
              errors.passwordConfirmation?.message ?? "Please confirm your password."
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
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
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Already have an account?{" "}
            <Typography
              component={Link}
              href={ROUTES.AUTH_LOGIN}
              variant="body2"
              color="primary"
              sx={{
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Login
            </Typography>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
