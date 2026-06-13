import { z } from "zod";

export const roleChangeSchema = z.object({
  userId: z.string().min(1),
  newRole: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export type RoleChangeData = z.infer<typeof roleChangeSchema>;

export const coursePublishSchema = z.object({
  courseId: z.string().min(1),
  isPublished: z.boolean(),
});

export type CoursePublishData = z.infer<typeof coursePublishSchema>;

export const userUpdateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Invalid email"),
});

export type UserUpdateData = z.infer<typeof userUpdateSchema>;

export const bulkUserActionSchema = z
  .object({
    userIds: z.array(z.string().min(1)).min(1, "Select at least one user"),
    action: z.enum(["delete", "setRole"]),
    newRole: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
  })
  .refine((d) => d.action !== "setRole" || !!d.newRole, {
    message: "A role is required for setRole",
    path: ["newRole"],
  });

export type BulkUserActionData = z.infer<typeof bulkUserActionSchema>;

export const roleRequestSchema = z.object({
  requestedRole: z.enum(["TEACHER", "ADMIN"]),
  reason: z.string().max(500).optional(),
});

export type RoleRequestData = z.infer<typeof roleRequestSchema>;

export const reviewRoleRequestSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
});

export type ReviewRoleRequestData = z.infer<typeof reviewRoleRequestSchema>;

export const broadcastSchema = z.object({
  message: z.string().min(1, "Message is required").max(500),
  targetRole: z.enum(["ALL", "STUDENT", "TEACHER", "ADMIN"]),
});

export type BroadcastData = z.infer<typeof broadcastSchema>;

export const systemSettingsSchema = z.object({
  platformName: z.string().min(1, "Platform name is required").max(100),
  allowSelfRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
});

export type SystemSettingsData = z.infer<typeof systemSettingsSchema>;
