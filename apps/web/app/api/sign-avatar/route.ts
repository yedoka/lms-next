import { createUploadSignatureHandler } from "@/shared/lib/cloudinary-signing";
import { CLOUDINARY_CONFIG } from "@/shared/lib/config";
import { ALL_ROLES } from "@/features/auth/utils/roles";

// Every user owns a profile picture, so this endpoint is open to all roles —
// unlike /api/sign-image, which signs course thumbnails for authors only.
// Both pin the same Cloudinary preset; a dedicated `lms_avatars` preset would
// have to be created in the Cloudinary dashboard first.
export const POST = createUploadSignatureHandler(
  CLOUDINARY_CONFIG.PRESETS.THUMBNAILS,
  "Sign avatar",
  ALL_ROLES,
);
