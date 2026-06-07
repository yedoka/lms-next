"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { Trash, ImagePlus } from "lucide-react";
import { CLOUDINARY_CONFIG } from "@/shared/lib/config";
import { profileSchema, type ProfileFormData } from "@/features/settings/schemas/schema";
import { updateProfile } from "@/features/settings/actions/server-actions";

interface ProfileSettingsFormProps {
  initialData: {
    name: string | null;
    image: string | null;
    email: string | null;
  };
}

export function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name ?? "",
      image: initialData.image ?? "",
    },
  });

  const imageValue = watch("image");

  const onSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      const result = await updateProfile(data);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      await update({ name: result.data?.name, image: result.data?.image });
      toast.success("Profile updated");
    });
  };

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Profile picture
        </Typography>
        <Controller
          control={control}
          name="image"
          render={({ field }) => (
            <AvatarUpload value={field.value ?? ""} onChange={field.onChange} />
          )}
        />
      </Box>

      <TextField
        label="Display name"
        fullWidth
        {...register("name")}
        error={!!errors.name}
        helperText={errors.name?.message}
      />

      <TextField
        label="Email address"
        fullWidth
        value={initialData.email ?? ""}
        disabled
        helperText="Email cannot be changed"
      />

      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </Box>
    </Stack>
  );
}

function AvatarUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const initial = "U";

  if (value) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar src={value} sx={{ width: 72, height: 72 }} />
        <IconButton
          size="small"
          onClick={() => onChange("")}
          sx={{
            bgcolor: "error.main",
            color: "error.contrastText",
            "&:hover": { bgcolor: "error.dark" },
            p: 0.75,
          }}
        >
          <Trash size={16} />
        </IconButton>
      </Box>
    );
  }

  if (!cloudName) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ width: 72, height: 72, bgcolor: "primary.main", fontSize: 28, fontWeight: 600 }}>
          {initial}
        </Avatar>
        <Button variant="outlined" disabled startIcon={<ImagePlus size={16} />}>
          Upload avatar
        </Button>
      </Box>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { CldUploadWidget } = require("next-cloudinary");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar sx={{ width: 72, height: 72, bgcolor: "primary.main", fontSize: 28, fontWeight: 600 }}>
        {initial}
      </Avatar>
      <CldUploadWidget
        onSuccess={(result: { info: { secure_url: string } }) => {
          onChange(result.info.secure_url);
        }}
        uploadPreset={CLOUDINARY_CONFIG.PRESETS.THUMBNAILS}
        signatureEndpoint="/api/sign-image"
        options={{ maxFiles: 1, cropping: true, croppingAspectRatio: 1 }}
      >
        {({ open }: { open: () => void }) => (
          <Button
            type="button"
            variant="outlined"
            onClick={() => open()}
            startIcon={<ImagePlus size={16} />}
          >
            Upload avatar
          </Button>
        )}
      </CldUploadWidget>
    </Box>
  );
}
