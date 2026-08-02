"use client";

import { ImagePlus, Trash } from "lucide-react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { CLOUDINARY_CONFIG } from "@/shared/lib/config";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}

function UploadPlaceholder() {
  return (
    <Button variant="outlined" disabled sx={{ mt: 1 }}>
      Image upload unavailable — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    </Button>
  );
}

export const ImageUpload = ({ value, onChange, onRemove }: ImageUploadProps) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (value) {
    return (
      <Box
        sx={{
          position: "relative",
          aspectRatio: "16/9",
          mt: 1,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Upload" style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
          <IconButton
            size="small"
            onClick={onRemove}
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
      </Box>
    );
  }

  if (!cloudName) {
    return <UploadPlaceholder />;
  }

  // Dynamically import to avoid SSR issues with next-cloudinary
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { CldUploadWidget } = require("next-cloudinary");

  return (
    <CldUploadWidget
      onSuccess={(result: { info: { secure_url: string } }) => {
        onChange(result.info.secure_url);
      }}
      uploadPreset={CLOUDINARY_CONFIG.PRESETS.THUMBNAILS}
      signatureEndpoint="/api/sign-image"
      options={{
        maxFiles: 1,
      }}
    >
      {({ open }: { open: () => void }) => {
        return (
          <Button
            type="button"
            variant="outlined"
            onClick={() => open()}
            startIcon={<ImagePlus size={16} />}
            sx={{ mt: 1 }}
          >
            Upload an Image
          </Button>
        );
      }}
    </CldUploadWidget>
  );
};
