"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface QuizResultsProps {
  courseId: string;
  lessonId: string;
  attempt: {
    score: number;
    passed: boolean;
    quiz: {
      passingScore: number;
      title: string;
    };
    answers: {
      question: { text: string };
      answer: { text: string; isCorrect: boolean };
    }[];
  };
}

export function QuizResults({ courseId, lessonId, attempt }: QuizResultsProps) {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="text-center py-8 mb-8 border-none shadow-none bg-muted/30">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            {attempt.passed ? "Congratulations!" : "Keep Trying!"}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            You scored {attempt.score}% (Passing score is{" "}
            {attempt.quiz.passingScore}%)
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center border-4",
                attempt.passed
                  ? "border-green-500 text-green-500"
                  : "border-destructive text-destructive",
              )}
            >
              <span className="text-4xl font-bold">{attempt.score}%</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href={`/courses/${courseId}/lessons/${lessonId}/quiz`}>
              Retake Quiz
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/courses/${courseId}/lessons/${lessonId}`}>
              Back to Lesson
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Question Breakdown</h3>
        {attempt.answers.map((attemptAnswer, i) => (
          <Card key={i} className="border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {attemptAnswer.answer.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Question {i + 1}
                  </div>
                  <CardTitle className="text-base font-medium leading-relaxed">
                    {attemptAnswer.question.text}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pl-12">
              <div className="text-sm p-3 rounded-md bg-muted/30">
                <span className="text-muted-foreground">Your answer: </span>
                <span
                  className={cn(
                    "font-medium",
                    attemptAnswer.answer.isCorrect
                      ? "text-green-600 dark:text-green-400"
                      : "text-destructive",
                  )}
                >
                  {attemptAnswer.answer.text}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
