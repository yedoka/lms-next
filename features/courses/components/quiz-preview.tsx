"use client";

import { Quiz, Question, Answer } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

interface QuizPreviewProps {
  quiz: Quiz & { questions: (Question & { answers: Answer[] })[] };
  courseId: string;
}

export const QuizPreview = ({ quiz, courseId }: QuizPreviewProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const question = quiz.questions[currentQuestionIndex];

  const handleSelectAnswer = (answerId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [question.id]: answerId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsSubmitted(true);
      toast.success("Preview quiz finished! No data was saved.");
    }
  };

  const calculateScore = () => {
    let score = 0;
    let totalPoints = 0;
    quiz.questions.forEach(q => {
      totalPoints += q.points;
      const selected = selectedAnswers[q.id];
      const correct = q.answers.find(a => a.isCorrect);
      if (selected === correct?.id) {
        score += q.points;
      }
    });
    return { score, totalPoints, percentage: Math.round((score / totalPoints) * 100) || 0 };
  };

  if (!question && !isSubmitted) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          No questions in this quiz.
        </Typography>
        <Button
          component={Link}
          href={`/dashboard/teacher/courses/${courseId}/edit`}
          variant="outlined"
        >
          Back to Course
        </Button>
      </Box>
    );
  }

  const { score, totalPoints, percentage } = isSubmitted ? calculateScore() : { score: 0, totalPoints: 0, percentage: 0 };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Button
          component={Link}
          href={`/dashboard/teacher/courses/${courseId}/edit`}
          variant="text"
          size="small"
          startIcon={<ArrowLeft size={16} />}
          sx={{ color: "text.secondary", p: 0.5 }}
        >
          Exit Preview
        </Button>
      </Box>

      <Card sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ bgcolor: "action.hover", p: 3, borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="h5" component="h1" fontWeight={700}>
              {quiz.title}
            </Typography>
            <Chip label="Preview Mode" size="small" color="info" variant="outlined" sx={{ fontWeight: 600 }} />
          </Box>
          <Stack direction="row" spacing={2} sx={{ color: "text.secondary" }}>
            {quiz.timeLimit ? <Typography variant="body2">Time Limit: {quiz.timeLimit}m</Typography> : null}
            <Typography variant="body2">Passing Score: {quiz.passingScore}%</Typography>
            <Typography variant="body2">{quiz.questions.length} Questions</Typography>
          </Stack>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {!isSubmitted ? (
            <Stack spacing={4}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Question {currentQuestionIndex + 1} of {quiz.questions.length} ({question.points} pts)
                </Typography>
                <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.4 }}>
                  {question.text}
                </Typography>
              </Box>

              <Stack spacing={2}>
                {question.answers.map(answer => {
                  const isSelected = selectedAnswers[question.id] === answer.id;
                  return (
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
                        borderColor: isSelected ? "info.main" : "divider",
                        bgcolor: isSelected ? "rgba(2, 136, 209, 0.08)" : "background.paper",
                        color: isSelected ? "info.main" : "text.primary",
                        fontWeight: isSelected ? 600 : 400,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        "&:hover": {
                          bgcolor: isSelected ? "rgba(2, 136, 209, 0.12)" : "action.hover",
                          borderColor: isSelected ? "info.main" : "text.secondary",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: 1,
                          borderColor: isSelected ? "info.main" : "text.disabled",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 1,
                        }}
                      >
                        {isSelected && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "info.main",
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" component="span" sx={{ flex: 1 }}>
                        {answer.text}
                      </Typography>
                    </Button>
                  );
                })}
              </Stack>

              <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!selectedAnswers[question.id]}
                >
                  {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                </Button>
              </Box>
            </Stack>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
                Quiz Results
              </Typography>
              
              <Stack spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <Typography
                  variant="h2"
                  fontWeight={800}
                  sx={{
                    color: percentage >= quiz.passingScore ? "success.main" : "error.main"
                  }}
                >
                  {percentage}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  You scored {score} out of {totalPoints} points.
                </Typography>
                
                {percentage >= quiz.passingScore ? (
                  <Chip
                    label="Passed"
                    sx={{
                      fontWeight: 600,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      bgcolor: "rgba(68,131,97,0.1)",
                      color: "success.main",
                      border: "none",
                    }}
                  />
                ) : (
                  <Chip
                    label="Failed"
                    sx={{
                      fontWeight: 600,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      bgcolor: "rgba(211,47,47,0.1)",
                      color: "error.main",
                      border: "none",
                    }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={2} justifyContent="center" sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                  }}
                >
                  Retake Preview
                </Button>
                <Button
                  component={Link}
                  href={`/dashboard/teacher/courses/${courseId}/lessons/${quiz.lessonId}/quiz`}
                  variant="contained"
                >
                  Edit Quiz
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};
