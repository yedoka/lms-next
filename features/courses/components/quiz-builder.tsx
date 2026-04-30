"use client";

import { Quiz, Question, Answer } from "@prisma/client";
import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quizSchema, QuizFormData } from "../schemas/quiz";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Field, FieldLabel, FieldContent, FieldError } from "@/shared/ui/field";
import { toast } from "sonner";
import {
  updateQuizAction,
  createQuestionAction,
  reorderQuestionsAction,
} from "../actions/quiz-actions";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { QuestionList } from "./question-list";

interface QuizBuilderProps {
  quiz: Quiz & { questions: (Question & { answers: Answer[] })[] };
  courseId: string;
  lessonId: string;
}

export const QuizBuilder = ({ quiz, courseId, lessonId }: QuizBuilderProps) => {
  const [activeTab, setActiveTab] = useState<"settings" | "questions">(
    "settings",
  );
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      isPublished: quiz.isPublished,
    },
  });

  const onSubmit = (data: QuizFormData) => {
    startTransition(async () => {
      try {
        await updateQuizAction(courseId, lessonId, quiz.id, data);
        toast.success("Quiz updated");
      } catch (error) {
        toast.error("Failed to update quiz");
      }
    });
  };

  const handleAddQuestion = (type: "MULTIPLE_CHOICE" | "BOOLEAN") => {
    startTransition(async () => {
      try {
        await createQuestionAction(courseId, lessonId, quiz.id, type);
        toast.success("Question created");
        setActiveTab("questions");
      } catch (error) {
        toast.error("Failed to create question");
      }
    });
  };

  const handleReorder = (updates: { id: string; position: number }[]) => {
    startTransition(async () => {
      try {
        await reorderQuestionsAction(courseId, lessonId, quiz.id, updates);
        toast.success("Questions reordered");
      } catch (error) {
        toast.error("Failed to reorder questions");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Button variant="ghost" asChild>
            <Link href={`/dashboard/teacher/courses/${courseId}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to course
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <h1 className="text-2xl font-medium">Quiz Builder</h1>
        <span className="text-sm text-slate-700">
          Manage settings and questions for: {quiz.title}
        </span>
      </div>

      <div className="flex gap-x-2 border-b">
        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </Button>
        <Button
          variant={activeTab === "questions" ? "default" : "ghost"}
          onClick={() => setActiveTab("questions")}
        >
          Questions ({quiz.questions.length})
        </Button>
      </div>

      {activeTab === "settings" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Field data-invalid={!!errors.title}>
                <FieldLabel>Quiz Title</FieldLabel>
                <FieldContent>
                  <Input disabled={isPending} {...field} />
                  {errors.title?.message && (
                    <FieldError>{errors.title.message}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="timeLimit"
            render={({ field }) => (
              <Field data-invalid={!!errors.timeLimit}>
                <FieldLabel>Time Limit (minutes)</FieldLabel>
                <div className="text-sm text-muted-foreground mb-2">
                  Leave blank for no limit.
                </div>
                <FieldContent>
                  <Input
                    type="number"
                    disabled={isPending}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                  />
                  {errors.timeLimit?.message && (
                    <FieldError>{errors.timeLimit.message}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="passingScore"
            render={({ field }) => (
              <Field data-invalid={!!errors.passingScore}>
                <FieldLabel>Passing Score (%)</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    disabled={isPending}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                  {errors.passingScore?.message && (
                    <FieldError>{errors.passingScore.message}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="isPublished"
            render={({ field }) => (
              <Field>
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FieldLabel>Publish Quiz</FieldLabel>
                    <div className="text-sm text-muted-foreground">
                      Make this quiz visible to students (requires lesson to be
                      published too).
                    </div>
                  </div>
                  <FieldContent className="flex-initial">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FieldContent>
                </div>
              </Field>
            )}
          />

          <Button disabled={isPending} type="submit">
            Save settings
          </Button>
        </form>
      )}

      {activeTab === "questions" && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Questions</h2>
            <div className="flex items-center gap-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddQuestion("MULTIPLE_CHOICE")}
                disabled={isPending}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Multiple Choice
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddQuestion("BOOLEAN")}
                disabled={isPending}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                True/False
              </Button>
            </div>
          </div>

          <QuestionList
            items={quiz.questions}
            courseId={courseId}
            lessonId={lessonId}
            quizId={quiz.id}
            onReorder={handleReorder}
          />
        </div>
      )}
    </div>
  );
};
