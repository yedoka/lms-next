"use server";

import { revalidatePath } from "next/cache";
import argon2 from "argon2";
import { profileSchema, passwordSchema } from "@/features/settings/schemas/schema";
import {
  updateUserProfile,
  getUserPasswordHash,
  updateUserPassword,
} from "@/features/settings/services/service";
import { requireAuth } from "@/features/auth/utils/with-role";
import type { ProfileFormData, PasswordFormData } from "@/features/settings/schemas/schema";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; message: string };

export const updateProfile = async (
  input: ProfileFormData
): Promise<ActionResult<{ name: string; image: string | null }>> => {
  try {
    const session = await requireAuth();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input data" };
    }

    const updated = await updateUserProfile(session.user.id, parsed.data);
    revalidatePath("/dashboard/settings");
    revalidatePath("/", "layout");

    return { ok: true, data: { name: updated.name ?? "", image: updated.image } };
  } catch (error) {
    console.error("[UPDATE_PROFILE_ERROR]", error);
    return { ok: false, message: "Failed to update profile" };
  }
};

export const changePassword = async (
  input: PasswordFormData
): Promise<ActionResult> => {
  try {
    const session = await requireAuth();
    const parsed = passwordSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input data" };
    }

    const { currentPassword, newPassword } = parsed.data;
    const currentHash = await getUserPasswordHash(session.user.id);

    if (!currentHash) {
      return { ok: false, message: "User not found" };
    }

    const isValid = await argon2.verify(currentHash, currentPassword);
    if (!isValid) {
      return { ok: false, message: "Current password is incorrect" };
    }

    const hashedPassword = await argon2.hash(newPassword);
    await updateUserPassword(session.user.id, hashedPassword);

    return { ok: true };
  } catch (error) {
    console.error("[CHANGE_PASSWORD_ERROR]", error);
    return { ok: false, message: "Failed to change password" };
  }
};
