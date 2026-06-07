"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuizTimer } from "./quiz-timer";
import { submitQuizAction } from "../actions/quiz-actions";
import { toast } from "sonner";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";

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

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <Box sx={{ maxWidth: 768, mx: "auto", py: 4, px: 2 }}>
        <Card sx={{ textAlign: "center", py: 6 }}>
          <CardHeader
            title={
              <Typography variant="h6" fontWeight={600}>
                No Questions Found
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                This quiz doesn&apos;t have any questions yet.
              </Typography>
            }
          />
          <CardActions sx={{ justifyContent: "center", pb: 3 }}>
            <Button
              component={Link}
              href={`/courses/${courseId}/lessons/${lessonId}`}
              variant="contained"
            >
              Back to Lesson
            </Button>
          </CardActions>
        </Card>
      </Box>
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

  const progress = ((currentIdx + 1) / quiz.questions.length) * 100;

  return (
    <Box sx={{ maxWidth: 768, mx: "auto", py: 4, px: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          {quiz.title}
        </Typography>
        {quiz.timeLimit && (
          <QuizTimer
            timeLimitMinutes={quiz.timeLimit}
            onExpire={handleSubmit}
          />
        )}
      </Box>

      <Box sx={{ width: "100%", mb: 4 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>

      <Card sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <CardHeader
          title={
            <Typography variant="h6" component="h2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
              {currentQuestion.text}
            </Typography>
          }
          subheader={
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Question {currentIdx + 1} of {quiz.questions.length}
            </Typography>
          }
          sx={{ borderBottom: 1, borderColor: "divider", px: 3, py: 2.5 }}
        />
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {currentQuestion.answers.map((answer) => (
              <Button
                key={answer.id}
                onClick={() => handleSelectAnswer(answer.id)}
                variant="outlined"
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  textAlign: "left",
                  p: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  borderColor: currentSelectedAnswerId === answer.id ? "info.main" : "divider",
                  bgcolor: currentSelectedAnswerId === answer.id ? "rgba(2, 136, 209, 0.08)" : "background.paper",
                  color: currentSelectedAnswerId === answer.id ? "info.main" : "text.primary",
                  fontWeight: currentSelectedAnswerId === answer.id ? 600 : 400,
                  "&:hover": {
                    bgcolor: currentSelectedAnswerId === answer.id ? "rgba(2, 136, 209, 0.12)" : "action.hover",
                    borderColor: currentSelectedAnswerId === answer.id ? "info.main" : "text.secondary",
                  },
                }}
              >
                {answer.text}
              </Button>
            ))}
          </Stack>
        </CardContent>
        <CardActions sx={{ justifyContent: "space-between", px: 3, pb: 3, pt: 1 }}>
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentIdx === 0 || isSubmitting}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!currentSelectedAnswerId || isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : isLastQuestion
                ? "Submit Quiz"
                : "Next"}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
