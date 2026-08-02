import prisma from "@/shared/db/prisma";

export async function getPendingRequests() {
  return prisma.roleRequest.findMany({
    where: { status: "PENDING" },
    select: {
      id: true,
      requestedRole: true,
      reason: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRequestById(id: string) {
  return prisma.roleRequest.findUnique({
    where: { id },
    select: { id: true, userId: true, requestedRole: true, status: true },
  });
}

export async function getPendingRequestForUser(userId: string) {
  return prisma.roleRequest.findFirst({
    where: { userId, status: "PENDING" },
    select: { id: true, requestedRole: true, createdAt: true },
  });
}
