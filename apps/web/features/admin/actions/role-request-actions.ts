"use server";

import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { revalidatePath } from "next/cache";
import prisma from "@/shared/db/prisma";
import { publishNotification } from "@/shared/lib/publish-notification";
import {
  roleRequestSchema,
  reviewRoleRequestSchema,
} from "@/features/admin/schemas/schema";
import type {
  RoleRequestData,
  ReviewRoleRequestData,
} from "@/features/admin/schemas/schema";

// Student-facing: submit a request to be upgraded to a new role
export async function requestRole(data: RoleRequestData) {
  const session = await requireAuth();

  const parsed = roleRequestSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid request data");

  if (parsed.data.requestedRole === session.user.role) {
    throw new Error("You already have this role");
  }

  // Prevent duplicate pending requests
  const existing = await prisma.roleRequest.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
    select: { id: true },
  });
  if (existing) throw new Error("You already have a pending request");

  await prisma.roleRequest.create({
    data: {
      userId: session.user.id,
      requestedRole: parsed.data.requestedRole,
      reason: parsed.data.reason || null,
    },
  });

  revalidatePath("/dashboard/admin/requests");
  return { success: true };
}

// Admin-facing: approve or reject a pending request
export async function reviewRoleRequest(data: ReviewRoleRequestData) {
  const session = await requireAuth();
  if (session.user.role !== ROLE.ADMIN) throw new Error("Forbidden");

  const parsed = reviewRoleRequestSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid review data");

  const request = await prisma.roleRequest.findUnique({
    where: { id: parsed.data.requestId },
    select: { id: true, userId: true, requestedRole: true, status: true },
  });
  if (!request) throw new Error("Request not found");
  if (request.status !== "PENDING") throw new Error("Request already reviewed");

  const approved = parsed.data.decision === "APPROVE";

  await prisma.$transaction(async (tx) => {
    await tx.roleRequest.update({
      where: { id: request.id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });
    if (approved) {
      await tx.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole },
      });
    }
  });

  await publishNotification({
    userId: request.userId,
    type: "role_request",
    message: approved
      ? `Your request for the ${request.requestedRole} role was approved.`
      : `Your request for the ${request.requestedRole} role was rejected.`,
  });

  revalidatePath("/dashboard/admin/requests");
  return { success: true };
}
