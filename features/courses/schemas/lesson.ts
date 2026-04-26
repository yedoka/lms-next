import { z } from "zod";

export const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoUrl: z.string().optional().nullable(),
  isPublished: z.boolean(),
  position: z.number().int().optional(),
});

export type LessonFormData = z.infer<typeof lessonSchema>;

export const reorderLessonsSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string(),
      position: z.number().int(),
    })
  ),
});

export type ReorderLessonsData = z.infer<typeof reorderLessonsSchema>;
