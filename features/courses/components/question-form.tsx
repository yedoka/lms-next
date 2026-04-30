"use client";

import { Question, Answer } from "@prisma/client";
import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, QuestionFormData } from "../schemas/quiz";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field, FieldLabel, FieldContent, FieldError } from "@/shared/ui/field";
import { toast } from "sonner";
import { updateQuestionAction, createAnswerAction, updateAnswerAction, deleteAnswerAction, setCorrectAnswerAction } from "../actions/quiz-actions";
import { PlusCircle, Trash, CheckCircle } from "lucide-react";

interface QuestionFormProps {
  question: Question & { answers: Answer[] };
  courseId: string;
  lessonId: string;
  onSuccess?: () => void;
}

export const QuestionForm = ({ question, courseId, lessonId, onSuccess }: QuestionFormProps) => {
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, formState: { errors } } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: question.text,
      type: question.type,
      points: question.points,
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    startTransition(async () => {
      try {
        await updateQuestionAction(courseId, lessonId, question.id, data);
        toast.success("Question updated");
        onSuccess?.();
      } catch (error) {
        toast.error("Failed to update question");
      }
    });
  };

  const handleAddAnswer = () => {
    startTransition(async () => {
      try {
        await createAnswerAction(courseId, lessonId, question.id);
      } catch (error) {
        toast.error("Failed to add answer");
      }
    });
  };

  const handleUpdateAnswerText = (answerId: string, text: string) => {
    startTransition(async () => {
      try {
        await updateAnswerAction(courseId, lessonId, answerId, { text });
      } catch (error) {
        toast.error("Failed to update answer");
      }
    });
  };

  const handleDeleteAnswer = (answerId: string) => {
    startTransition(async () => {
      try {
        await deleteAnswerAction(courseId, lessonId, answerId);
      } catch (error) {
        toast.error("Failed to delete answer");
      }
    });
  };

  const handleSetCorrect = (answerId: string) => {
    startTransition(async () => {
      try {
        await setCorrectAnswerAction(courseId, lessonId, question.id, answerId, question.type === "MULTIPLE_CHOICE");
      } catch (error) {
        toast.error("Failed to set correct answer");
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <Field data-invalid={!!errors.text}>
              <FieldLabel>Question Text</FieldLabel>
              <FieldContent>
                <Input disabled={isPending} {...field} />
                {errors.text?.message && <FieldError>{errors.text.message}</FieldError>}
              </FieldContent>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="points"
          render={({ field }) => (
            <Field data-invalid={!!errors.points}>
              <FieldLabel>Points</FieldLabel>
              <FieldContent>
                <Input 
                  type="number" 
                  min="1" 
                  disabled={isPending} 
                  value={field.value} 
                  onChange={e => field.onChange(parseInt(e.target.value))} 
                />
                {errors.points?.message && <FieldError>{errors.points.message}</FieldError>}
              </FieldContent>
            </Field>
          )}
        />
        <Button disabled={isPending} type="submit">
          Save Question Details
        </Button>
      </form>

      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium leading-none">Answers</h3>
          {question.type === "MULTIPLE_CHOICE" && (
            <Button size="sm" variant="outline" onClick={handleAddAnswer} disabled={isPending}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {question.answers.map((answer) => (
            <div key={answer.id} className={`flex items-center gap-2 p-2 border rounded-md ${answer.isCorrect ? "border-green-500 bg-green-50" : "bg-slate-50"}`}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-auto p-1 rounded-full ${answer.isCorrect ? "text-green-600" : "text-slate-300"}`}
                onClick={() => handleSetCorrect(answer.id)}
                disabled={isPending}
              >
                <CheckCircle className="h-5 w-5" />
              </Button>
              
              {question.type === "MULTIPLE_CHOICE" ? (
                <Input 
                  className="flex-1 h-8 bg-white" 
                  defaultValue={answer.text}
                  onBlur={(e) => handleUpdateAnswerText(answer.id, e.target.value)}
                  disabled={isPending}
                />
              ) : (
                <div className="flex-1 px-3 text-sm font-medium">{answer.text}</div>
              )}
              
              {question.type === "MULTIPLE_CHOICE" && question.answers.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteAnswer(answer.id)}
                  disabled={isPending}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Click the checkmark circle to mark an answer as correct.</p>
      </div>
    </div>
  );
};
