"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/with-role";
import { ROLE } from "@/lib/auth/roles";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { courseSchema, CourseFormData } from "./schema";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  secure: true,
});

export async function createCourse(data: CourseFormData) {
  const session = await requireAuth();

  // Only teachers and admins can create courses
  if (session.user.role !== ROLE.TEACHER && session.user.role !== ROLE.ADMIN) {
    throw new Error("Unauthorized");
  }

  if (!session.user.id) {
    throw new Error("Unauthorized: No user ID");
  }

  const parsed = courseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const course = await prisma.course.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      thumbnail: parsed.data.thumbnail,
      isPublished: parsed.data.isPublished ?? false,
      teacherId: session.user.id,
    },
  });

  if (course.isPublished) {
    revalidateTag("courses", "max");
  }

  redirect("/dashboard/teacher");
}

export async function updateCourse(id: string, data: CourseFormData) {
  const session = await requireAuth();

  if (!session.user.id) {
    throw new Error("Unauthorized: No user ID");
  }

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.teacherId !== session.user.id && session.user.role !== ROLE.ADMIN) {
    throw new Error("Unauthorized");
  }

  const parsed = courseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const updatedCourse = await prisma.course.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      thumbnail: parsed.data.thumbnail,
      isPublished: parsed.data.isPublished ?? false,
    },
  });

  // Revalidate cache if status changed or it is published
  if (course.isPublished !== updatedCourse.isPublished || updatedCourse.isPublished) {
    revalidateTag("courses", "max");
  }

  redirect("/dashboard/teacher");
}

export async function deleteCourse(id: string) {
  const session = await requireAuth();

  if (!session.user.id) {
    throw new Error("Unauthorized: No user ID");
  }

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.teacherId !== session.user.id && session.user.role !== ROLE.ADMIN) {
    throw new Error("Unauthorized");
  }

  await prisma.course.delete({
    where: { id },
  });

  if (course.isPublished) {
    revalidateTag("courses", "max");
  }

  return { success: true };
}

export async function getCloudinarySignature() {
  const session = await requireAuth();

  if (session.user.role !== ROLE.TEACHER && session.user.role !== ROLE.ADMIN) {
    throw new Error("Unauthorized");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "lms_thumbnails",
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  };
}
