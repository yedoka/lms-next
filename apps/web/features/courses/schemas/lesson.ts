import { z } from "zod";

export const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoUrl: z.string().optional().nullable(),
  isPublished: z.boolean(),
  position: z.number().int().optional(),
});

export type LessonFormData = z.infer<typeof lessonSchema>;

export const attachmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  url: z.string().url("Must be a valid URL"),
  size: z.number().int().nonnegative(),
});

export type AttachmentFormData = z.infer<typeof attachmentSchema>;

export const reorderLessonsSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string(),
      position: z.number().int(),
    })
  ),
});

export type ReorderLessonsData = z.infer<typeof reorderLessonsSchema>;
