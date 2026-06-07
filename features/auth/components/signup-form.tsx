"use client";

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

type SignupInput = z.infer<typeof SignupSchema>;

export function SignupForm() {
  const router = useRouter();

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
      role: undefined,
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
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Create an account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your information below to create your account
        </Typography>

        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
          <TextField
            label="Full Name"
            size="small"
            fullWidth
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <TextField
            label="Email"
            type="email"
            size="small"
            fullWidth
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <FormControl error={!!errors.role}>
            <FormLabel sx={{ typography: "body2", fontWeight: 500, mb: 0.5 }}>
              I am signing up as
            </FormLabel>
            <RadioGroup row>
              <FormControlLabel
                value={ROLE.STUDENT}
                control={<Radio size="small" {...register("role")} />}
                label={<Typography variant="body2">Student</Typography>}
              />
              <FormControlLabel
                value={ROLE.TEACHER}
                control={<Radio size="small" {...register("role")} />}
                label={<Typography variant="body2">Teacher</Typography>}
              />
            </RadioGroup>
            {errors.role && (
              <FormHelperText>{errors.role.message}</FormHelperText>
            )}
          </FormControl>

          <TextField
            label="Password"
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

          <TextField
            label="Confirm Password"
            type="password"
            size="small"
            fullWidth
            {...register("passwordConfirmation")}
            error={!!errors.passwordConfirmation}
            helperText={
              errors.passwordConfirmation?.message ?? "Please confirm your password."
            }
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
            >
              Create Account
            </Button>

            <Button
              variant="outlined"
              fullWidth
              disabled={isSubmitting}
              type="button"
            >
              Sign up with Google
            </Button>

            <Typography variant="body2" color="text.secondary" align="center">
              Already have an account?{" "}
              <Typography
                component={Link}
                href={ROUTES.AUTH_LOGIN}
                variant="body2"
                color="info.main"
                sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Login
              </Typography>
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
