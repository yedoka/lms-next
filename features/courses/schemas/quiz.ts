import { z } from "zod";

export const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  timeLimit: z.number().int().min(0).optional().nullable(),
  passingScore: z.number().int().min(0).max(100),
  isPublished: z.boolean(),
});

export type QuizFormData = z.infer<typeof quizSchema>;

export const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["MULTIPLE_CHOICE", "BOOLEAN"]),
  points: z.number().int().min(1),
});

export type QuestionFormData = z.infer<typeof questionSchema>;

export const answerSchema = z.object({
  text: z.string().min(1, "Answer text is required"),
  isCorrect: z.boolean(),
});

export type AnswerFormData = z.infer<typeof answerSchema>;

export const reorderQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      position: z.number().int(),
    })
  ),
});

export type ReorderQuestionsData = z.infer<typeof reorderQuestionsSchema>;

