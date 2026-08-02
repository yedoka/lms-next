"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import {
  systemSettingsSchema,
  type SystemSettingsData,
} from "@/features/admin/schemas/schema";
import { saveSystemSettings } from "@/features/admin/actions/admin-actions";

interface Props {
  defaultValues: SystemSettingsData;
}

export function SystemSettingsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<SystemSettingsData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues,
  });

  const onSubmit = (data: SystemSettingsData) => {
    startTransition(async () => {
      try {
        await saveSystemSettings(data);
        toast.success("Settings saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save settings");
      }
    });
  };

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      spacing={3}
      sx={{ maxWidth: 480 }}
    >
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
          General
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TextField
          {...register("platformName")}
          label="Platform Name"
          fullWidth
          size="small"
          disabled={isPending}
          error={!!errors.platformName}
          helperText={errors.platformName?.message}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
          Access
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1}>
          <Controller
            name="allowSelfRegistration"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isPending}
                  />
                }
                label="Allow self-registration"
              />
            )}
          />
          <Controller
            name="maintenanceMode"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isPending}
                    color="warning"
                  />
                }
                label="Maintenance mode (blocks all logins)"
              />
            )}
          />
        </Stack>
      </Box>

      <Box>
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
      </Box>
    </Stack>
  );
}
