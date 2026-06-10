"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import * as notificationService from "../services/notification-service";

export async function getNotificationsAction() {
  const session = await requireAuth();
  return notificationService.getNotifications(session.user.id!);
}

export async function markAllAsReadAction() {
  const session = await requireAuth();
  await notificationService.markAllAsRead(session.user.id!);
}
