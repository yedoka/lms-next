import { createUploadSignatureHandler } from "@/shared/lib/cloudinary-signing";
import { CLOUDINARY_CONFIG } from "@/shared/lib/config";

export const POST = createUploadSignatureHandler(CLOUDINARY_CONFIG.PRESETS.VIDEOS, "Sign video");
