"use client";

import { useState, useEffect } from "react";
import { Video, Trash, Loader2 } from "lucide-react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { CLOUDINARY_CONFIG } from "@/shared/lib/config";

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}

export const VideoUpload = ({ value, onChange, onRemove }: VideoUploadProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

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
        <video src={value} controls style={{ objectFit: "cover", width: "100%", height: "100%" }} />
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
    return (
      <Button variant="outlined" disabled sx={{ mt: 1 }}>
        Video upload unavailable — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      </Button>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { CldUploadWidget } = require("next-cloudinary");

  return (
    <CldUploadWidget
      onSuccess={(result: { info: { secure_url: string } }) => {
        onChange(result.info.secure_url);
      }}
      uploadPreset={CLOUDINARY_CONFIG.PRESETS.VIDEOS}
      signatureEndpoint="/api/sign-video"
      options={{
        maxFiles: 1,
        resourceType: "video",
      }}
    >
      {({ open, isLoading }: { open: () => void; isLoading: boolean }) => {
        return (
          <Button
            type="button"
            variant="outlined"
            onClick={() => open()}
            startIcon={isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Video size={16} />}
            disabled={isLoading}
            sx={{ mt: 1 }}
          >
            Upload a Video
          </Button>
        );
      }}
    </CldUploadWidget>
  );
};
