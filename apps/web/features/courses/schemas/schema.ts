import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().optional(),
  category: z.string().optional(), // In the DB it is category String?
  thumbnail: z.url("Must be a valid URL").optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
});

export type CourseFormData = z.infer<typeof courseSchema>;
