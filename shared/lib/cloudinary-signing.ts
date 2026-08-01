import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ROLE } from "@/features/auth/utils/roles";
import type { UserRole } from "@prisma/client";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Parameters the upload widget legitimately sends. Anything outside this list
 * is refused rather than signed: a signature is an authorization to upload on
 * this account's behalf, and signing arbitrary parameters hands the caller
 * control over destination, transformation and delivery settings.
 */
const ALLOWED_PARAMS = new Set([
  "timestamp",
  "upload_preset",
  "source",
  "folder",
  "public_id",
  "filename_override",
  "tags",
  "context",
]);

/** A signature older than this is refused, limiting replay of a leaked one. */
const MAX_TIMESTAMP_SKEW_SECONDS = 60 * 10;

/**
 * Builds a POST handler that signs Cloudinary upload parameters for exactly one
 * upload preset.
 *
 * The preset is the real control surface: it pins resource type, destination
 * folder and size/format limits on Cloudinary's side. Pinning it here is what
 * stops an authorized teacher from redirecting an upload somewhere else. The
 * per-preset limits themselves must be configured in the Cloudinary dashboard —
 * the `clientAllowedFormats` and `maxFileSize` options passed to the widget are
 * browser-side conveniences and are not enforced by anything on the server.
 *
 * `allowedRoles` defaults to the authoring roles. Pass it explicitly for an
 * endpoint that serves content every user owns, such as their own avatar.
 */
export function createUploadSignatureHandler(
  expectedPreset: string,
  label: string,
  allowedRoles: readonly UserRole[] = [ROLE.TEACHER, ROLE.ADMIN],
) {
  return async function POST(request: Request) {
    const session = await auth();

    // Deliberately not `requireAuth()`: that throws a NEXT_REDIRECT which this
    // handler's catch would turn into an opaque 500 for an unauthenticated
    // caller. A route handler answers with a status code.
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const body = await request.json();
      const paramsToSign = body?.paramsToSign;

      if (!paramsToSign || typeof paramsToSign !== "object" || Array.isArray(paramsToSign)) {
        return NextResponse.json({ error: "Invalid paramsToSign" }, { status: 400 });
      }

      const params = paramsToSign as Record<string, unknown>;

      const unexpected = Object.keys(params).filter((key) => !ALLOWED_PARAMS.has(key));
      if (unexpected.length > 0) {
        return NextResponse.json(
          { error: `Unsupported upload parameter(s): ${unexpected.join(", ")}` },
          { status: 400 },
        );
      }

      if (params.upload_preset !== expectedPreset) {
        return NextResponse.json(
          { error: "Upload preset not allowed for this endpoint" },
          { status: 400 },
        );
      }

      const timestamp = Number(params.timestamp);
      if (!Number.isFinite(timestamp)) {
        return NextResponse.json({ error: "Missing or invalid timestamp" }, { status: 400 });
      }

      const skew = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
      if (skew > MAX_TIMESTAMP_SKEW_SECONDS) {
        return NextResponse.json({ error: "Stale timestamp" }, { status: 400 });
      }

      const signature = cloudinary.utils.api_sign_request(
        params,
        process.env.CLOUDINARY_API_SECRET!,
      );

      return NextResponse.json({ signature });
    } catch (error) {
      console.error(`${label} signing error`, error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
