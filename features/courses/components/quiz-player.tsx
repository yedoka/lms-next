"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { QuizTimer } from "./quiz-timer";
import { submitQuizAction } from "../actions/quiz-actions";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";

type QuizData = {
  id: string;
  title: string;
  timeLimit: number | null;
  questions: {
    id: string;
    text: string;
    type: "MULTIPLE_CHOICE" | "BOOLEAN";
    answers: { id: string; text: string }[];
  }[];
};

export function QuizPlayer({
  courseId,
  lessonId,
  quiz,
}: {
  courseId: string;
  lessonId: string;
  quiz: QuizData;
}) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No Questions Found</CardTitle>
            <p className="text-muted-foreground mt-2">
              This quiz doesn&apos;t have any questions yet.
            </p>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href={`/courses/${courseId}/lessons/${lessonId}`}>
                Back to Lesson
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const isLastQuestion = currentIdx === quiz.questions.length - 1;
  const currentSelectedAnswerId = answers[currentQuestion.id];

  const handleSelectAnswer = (answerId: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answerId }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, answerId]) => ({
          questionId,
          answerId,
        }),
      );

      const data = {
        quizId: quiz.id,
        answers: formattedAnswers,
      };

      const result = await submitQuizAction(courseId, lessonId, data);

      toast.success("Quiz submitted successfully!");
      router.push(
        `/courses/${courseId}/lessons/${lessonId}/quiz/results/${result.attemptId}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit quiz";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const progress = ((currentIdx + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{quiz.title}</h1>
        {quiz.timeLimit && (
          <QuizTimer
            timeLimitMinutes={quiz.timeLimit}
            onExpire={handleSubmit}
          />
        )}
      </div>

      <div className="w-full bg-muted h-2 rounded-full mb-8 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm text-muted-foreground mb-2">
            Question {currentIdx + 1} of {quiz.questions.length}
          </div>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.answers.map((answer) => (
            <button
              key={answer.id}
              onClick={() => handleSelectAnswer(answer.id)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all duration-200",
                currentSelectedAnswerId === answer.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/50",
              )}
            >
              {answer.text}
            </button>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIdx === 0 || isSubmitting}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!currentSelectedAnswerId || isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : isLastQuestion
                ? "Submit Quiz"
                : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
