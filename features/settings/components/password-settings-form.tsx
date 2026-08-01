"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { ROUTES } from "@/features/auth/utils/routes";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { Eye, EyeOff } from "lucide-react";
import { passwordSchema, type PasswordFormData } from "@/features/settings/schemas/schema";
import { changePassword } from "@/features/settings/actions/server-actions";

export function PasswordSettingsForm() {
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data: PasswordFormData) => {
    startTransition(async () => {
      const result = await changePassword(data);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Password changed. Please sign in again.");
      reset();
      // Changing the password revoked every session, this one included.
      // Sign out explicitly so the UI does not sit on a session the server
      // will now reject on the next request.
      await signOut({ callbackUrl: ROUTES.AUTH_LOGIN });
    });
  };

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
      <TextField
        label="Current password"
        type={showCurrent ? "text" : "password"}
        fullWidth
        {...register("currentPassword")}
        error={!!errors.currentPassword}
        helperText={errors.currentPassword?.message}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowCurrent((v) => !v)} edge="end">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        label="New password"
        type={showNew ? "text" : "password"}
        fullWidth
        {...register("newPassword")}
        error={!!errors.newPassword}
        helperText={errors.newPassword?.message}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowNew((v) => !v)} edge="end">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        label="Confirm new password"
        type={showConfirm ? "text" : "password"}
        fullWidth
        {...register("confirmPassword")}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowConfirm((v) => !v)} edge="end">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isPending ? "Changing…" : "Change password"}
        </Button>
      </Box>
    </Stack>
  );
}
