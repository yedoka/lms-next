"use client";

import { FilePlus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { CLOUDINARY_CONFIG } from "@/shared/lib/config";
import { toast } from "sonner";

interface FileUploadProps {
  onUpload: (result: { url: string; name: string; size: number }) => void;
  disabled?: boolean;
}

export const FileUpload = ({ onUpload, disabled }: FileUploadProps) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    return (
      <div className="mt-2 text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
        <p>File upload unavailable.</p>
        <p className="text-xs">
          Set <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> in your .env file.
        </p>
      </div>
    );
  }

  // Dynamically import to avoid SSR issues with next-cloudinary
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { CldUploadWidget } = require("next-cloudinary");

  return (
    <CldUploadWidget
      onSuccess={(result: unknown) => {
        const res = result as { info: { secure_url: string; original_filename: string; bytes: number } | string };
        if (typeof res.info === 'string' || !res.info) return;

        const info = res.info;
        // Extract the filename directly from the URL since info.format is undefined for raw files
        const filenameFromUrl = info.secure_url.split('/').pop();
        const finalName = filenameFromUrl ? decodeURIComponent(filenameFromUrl) : info.original_filename;
        
        onUpload({
          url: info.secure_url,
          name: finalName,
          size: info.bytes,
        });
      }}
      onError={(error: unknown) => {
        console.error("Upload error", error);
        toast.error("Failed to upload file");
      }}
      uploadPreset={CLOUDINARY_CONFIG.PRESETS.RAW}
      signatureEndpoint="/api/sign-raw"
      options={{
        maxFiles: 10,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        clientAllowedFormats: ["pdf", "docx", "pptx", "zip"],
        resourceType: "raw",
      }}
    >
      {({ open }: { open: () => void }) => {
        return (
          <Button
            type="button"
            variant="outline"
            onClick={() => open()}
            disabled={disabled}
            className="mt-2"
          >
            <FilePlus className="h-4 w-4 mr-2" />
            Add an Attachment
          </Button>
        );
      }}
    </CldUploadWidget>
  );
};
