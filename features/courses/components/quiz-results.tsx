"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

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
    <Box sx={{ maxWidth: 768, mx: "auto", py: 4, px: 2 }}>
      <Card
        sx={{
          textAlign: "center",
          py: 4,
          mb: 4,
          border: 1,
          borderColor: "divider",
          bgcolor: "action.hover",
          boxShadow: "none",
        }}
      >
        <CardHeader
          title={
            <Typography variant="h4" fontWeight={700}>
              {attempt.passed ? "Congratulations!" : "Keep Trying!"}
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You scored {attempt.score}% (Passing score is {attempt.quiz.passingScore}%)
            </Typography>
          }
        />
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Box
              sx={{
                width: 128,
                height: 128,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: 4,
                borderColor: attempt.passed ? "success.main" : "error.main",
                color: attempt.passed ? "success.main" : "error.main",
              }}
            >
              <Typography variant="h4" fontWeight={800}>
                {attempt.score}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
          <Button
            component={Link}
            href={`/courses/${courseId}/lessons/${lessonId}/quiz`}
            variant="outlined"
          >
            Retake Quiz
          </Button>
          <Button
            component={Link}
            href={`/courses/${courseId}/lessons/${lessonId}`}
            variant="contained"
          >
            Back to Lesson
          </Button>
        </CardActions>
      </Card>

      <Stack spacing={3}>
        <Typography variant="h6" fontWeight={600}>
          Question Breakdown
        </Typography>
        {attempt.answers.map((attemptAnswer, i) => (
          <Card key={i} sx={{ border: 1, borderColor: "divider", boxShadow: "none" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ mt: 0.5, display: "flex" }}>
                    {attemptAnswer.answer.isCorrect ? (
                      <CheckCircle2 size={20} style={{ color: "var(--mui-palette-success-main)" }} />
                    ) : (
                      <XCircle size={20} style={{ color: "var(--mui-palette-error-main)" }} />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      Question {i + 1}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
                      {attemptAnswer.question.text}
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ pb: 2 }}
            />
            <CardContent sx={{ pl: 5, pt: 0, pb: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Your answer:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: attemptAnswer.answer.isCorrect ? "success.main" : "error.main",
                  }}
                >
                  {attemptAnswer.answer.text}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
