import prisma from "@/shared/db/prisma";
import type { ProfileFormData } from "@/features/settings/schemas/schema";

export const getUserProfile = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
};

export const updateUserProfile = async (userId: string, data: ProfileFormData) => {
  return prisma.user.update({
    where: { id: userId },
    data: { name: data.name, image: data.image || null },
    select: { id: true, name: true, image: true },
  });
};

export const getUserPasswordHash = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  return user?.password ?? null;
};

export const updateUserPassword = async (userId: string, hashedPassword: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};
