"use server";

import { z } from "zod";

import { requireAuth } from "@/features/auth/utils/with-role";
import * as notificationService from "../services/notification-service";

// The limit reaches this action from client code, so it is validated rather
// than trusted: an unbounded `take` would let any caller pull their whole
// notification history in one request.
const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(notificationService.NOTIFICATIONS_MAX_LIMIT)
  .catch(notificationService.NOTIFICATIONS_DEFAULT_LIMIT);

export async function getNotificationsAction(limit?: number) {
  const session = await requireAuth();

  return notificationService.getNotifications(
    session.user.id!,
    limitSchema.parse(limit ?? notificationService.NOTIFICATIONS_DEFAULT_LIMIT),
  );
}

export async function markAllAsReadAction() {
  const session = await requireAuth();
  await notificationService.markAllAsRead(session.user.id!);
}
