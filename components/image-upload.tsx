"use client";

import { ImagePlus, Trash } from "lucide-react";
import { Button } from "./ui/button";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}

function UploadPlaceholder() {
  return (
    <div className="mt-2 text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
      <p>Image upload unavailable.</p>
      <p className="text-xs">
        Set <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> in your .env file.
      </p>
    </div>
  );
}

export const ImageUpload = ({ value, onChange, onRemove }: ImageUploadProps) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (value) {
    return (
      <div className="relative aspect-video mt-2 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Upload" className="object-cover w-full h-full" />
        <div className="absolute top-2 right-2">
          <Button
            type="button"
            onClick={onRemove}
            variant="destructive"
            size="sm"
            className="h-auto p-2"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
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
      uploadPreset="lms_thumbnails"
      signatureEndpoint="/api/sign-image"
      options={{
        maxFiles: 1,
      }}
    >
      {({ open }: { open: () => void }) => {
        return (
          <Button
            type="button"
            variant="outline"
            onClick={() => open()}
            className="mt-2"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Upload an Image
          </Button>
        );
      }}
    </CldUploadWidget>
  );
};
