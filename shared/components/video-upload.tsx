"use client";

import { Video, Trash, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { CLOUDINARY_CONFIG } from "@/shared/lib/config";

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}

export const VideoUpload = ({ value, onChange, onRemove }: VideoUploadProps) => {
  const [isMounted, setIsMounted] = (require("react")).useState(false);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  (require("react")).useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (value) {
    return (
      <div className="relative aspect-video mt-2 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
        <video
          src={value}
          controls
          className="object-cover w-full h-full"
        />
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
    return (
      <div className="mt-2 text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
        <p>Video upload unavailable.</p>
        <p className="text-xs">
          Set <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> in your .env file.
        </p>
      </div>
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
            variant="outline"
            onClick={() => open()}
            className="mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Video className="h-4 w-4 mr-2" />
            )}
            Upload a Video
          </Button>
        );
      }}
    </CldUploadWidget>
  );
};
