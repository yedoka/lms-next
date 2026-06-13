"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { revalidatePath, revalidateTag } from "next/cache";
import { SYSTEM_SETTINGS_TAG } from "@/features/admin/services/settings-service";
import prisma from "@/shared/db/prisma";
import {
  roleChangeSchema,
  coursePublishSchema,
  systemSettingsSchema,
  userUpdateSchema,
  broadcastSchema,
  bulkUserActionSchema,
} from "@/features/admin/schemas/schema";
import type {
  SystemSettingsData,
  BroadcastData,
  BulkUserActionData,
} from "@/features/admin/schemas/schema";
import * as settingsService from "@/features/admin/services/settings-service";
import { publishNotification } from "@/shared/lib/publish-notification";

async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== ROLE.ADMIN) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function updateUserRole(userId: string, newRole: string) {
  const session = await requireAdmin();

  const parsed = roleChangeSchema.safeParse({ userId, newRole });
  if (!parsed.success) throw new Error("Invalid data");

  if (parsed.data.userId === session.user.id) {
    throw new Error("You cannot change your own role");
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.newRole },
  });

  revalidatePath("/dashboard/admin/users");
}

export async function toggleCoursePublished(courseId: string, isPublished: boolean) {
  await requireAdmin();

  const parsed = coursePublishSchema.safeParse({ courseId, isPublished });
  if (!parsed.success) throw new Error("Invalid data");

  const course = await prisma.course.update({
    where: { id: parsed.data.courseId },
    data: { isPublished: parsed.data.isPublished },
    select: { id: true, title: true, teacherId: true },
  });

  // Notify the course's teacher that an admin changed their course visibility
  await publishNotification({
    userId: course.teacherId,
    type: "course_visibility",
    message: parsed.data.isPublished
      ? `An admin published your course "${course.title}".`
      : `An admin unpublished your course "${course.title}".`,
  });

  revalidatePath("/dashboard/admin/courses");
}

export async function updateUser(userId: string, name: string, email: string) {
  await requireAdmin();

  const parsed = userUpdateSchema.safeParse({ userId, name, email });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");

  const existing = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: userId } },
    select: { id: true },
  });
  if (existing) throw new Error("Email is already in use");

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { name: parsed.data.name, email: parsed.data.email },
  });

  revalidatePath("/dashboard/admin/users");
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin();

  if (!userId) throw new Error("Invalid user id");
  if (userId === session.user.id) throw new Error("You cannot delete your own account");

  await prisma.$transaction([
    // QuizOverride.updatedBy is nullable — clear it
    prisma.quizOverride.updateMany({
      where: { updatedBy: userId },
      data: { updatedBy: null },
    }),
    // QuizOverride.createdBy is non-nullable — remove overrides created by this user
    prisma.quizOverride.deleteMany({ where: { createdBy: userId } }),
    // All other relations cascade from User
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/dashboard/admin/users");
}

export async function bulkUserAction(data: BulkUserActionData) {
  const session = await requireAdmin();

  const parsed = bulkUserActionSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid bulk action data");

  // Never let an admin bulk-delete or demote their own account
  const ids = parsed.data.userIds.filter((id) => id !== session.user.id);
  if (ids.length === 0) throw new Error("No eligible users selected");

  if (parsed.data.action === "setRole") {
    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { role: parsed.data.newRole },
    });
  } else {
    await prisma.$transaction([
      // QuizOverride.updatedBy is nullable — clear it
      prisma.quizOverride.updateMany({
        where: { updatedBy: { in: ids } },
        data: { updatedBy: null },
      }),
      // QuizOverride.createdBy is non-nullable — remove overrides created by these users
      prisma.quizOverride.deleteMany({ where: { createdBy: { in: ids } } }),
      // All other relations cascade from User
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);
  }

  revalidatePath("/dashboard/admin/users");
  return { success: true, count: ids.length };
}

export async function broadcastAnnouncement(data: BroadcastData) {
  await requireAdmin();

  const parsed = broadcastSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid announcement data");

  const recipients = await prisma.user.findMany({
    where: parsed.data.targetRole === "ALL" ? {} : { role: parsed.data.targetRole },
    select: { id: true },
  });

  // Publish in chunks so a large user base doesn't overload the Redis publisher
  const CHUNK_SIZE = 100;
  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((u) =>
        publishNotification({
          userId: u.id,
          type: "announcement",
          message: parsed.data.message,
        }),
      ),
    );
  }

  return { success: true, count: recipients.length };
}

export async function saveSystemSettings(data: SystemSettingsData) {
  await requireAdmin();

  const parsed = systemSettingsSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid settings data");

  await settingsService.updateSettings(parsed.data);

  revalidateTag(SYSTEM_SETTINGS_TAG);
  revalidatePath("/dashboard/admin/settings");
}
