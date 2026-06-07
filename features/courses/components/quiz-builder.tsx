"use client";

import { Quiz, Question, Answer } from "@prisma/client";
import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quizSchema, QuizFormData } from "../schemas/quiz";
import { toast } from "sonner";
import {
  updateQuizAction,
  createQuestionAction,
  reorderQuestionsAction,
} from "../actions/quiz-actions";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { QuestionList } from "./question-list";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface QuizBuilderProps {
  quiz: Quiz & { questions: (Question & { answers: Answer[] })[] };
  courseId: string;
  lessonId: string;
}

export const QuizBuilder = ({ quiz, courseId, lessonId }: QuizBuilderProps) => {
  const [activeTab, setActiveTab] = useState<"settings" | "questions">("settings");
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
    <Stack spacing={3}>
      <Box>
        <Button
          component={Link}
          href={`/dashboard/teacher/courses/${courseId}/edit`}
          variant="text"
          size="small"
          startIcon={<ArrowLeft size={16} />}
          sx={{ color: "text.secondary", p: 0.5 }}
        >
          Back to course setup
        </Button>
      </Box>

      <Box>
        <Typography variant="h5" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
          Quiz Builder
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage settings and questions for: {quiz.title}
        </Typography>
      </Box>

      <Box>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
        >
          <Tab label="Settings" value="settings" />
          <Tab label={`Questions (${quiz.questions.length})`} value="questions" />
        </Tabs>
      </Box>

      {activeTab === "settings" && (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3} sx={{ maxWidth: 600 }}>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <TextField
                {...field}
                label="Quiz Title"
                disabled={isPending}
                fullWidth
                size="small"
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="timeLimit"
            render={({ field }) => (
              <TextField
                label="Time Limit (minutes)"
                type="number"
                placeholder="No limit"
                disabled={isPending}
                fullWidth
                size="small"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value ? parseInt(e.target.value) : null)
                }
                error={!!errors.timeLimit}
                helperText={errors.timeLimit?.message ?? "Leave blank for no limit."}
              />
            )}
          />

          <Controller
            control={control}
            name="passingScore"
            render={({ field }) => (
              <TextField
                label="Passing Score (%)"
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
                disabled={isPending}
                fullWidth
                size="small"
                value={field.value}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
                error={!!errors.passingScore}
                helperText={errors.passingScore?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="isPublished"
            render={({ field }) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Publish Quiz
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Make this quiz visible to students (requires lesson to be published too).
                  </Typography>
                </Box>
                <Switch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isPending}
                  color="info"
                />
              </Box>
            )}
          />

          <Box>
            <Button disabled={isPending} type="submit" variant="contained">
              Save settings
            </Button>
          </Box>
        </Stack>
      )}

      {activeTab === "questions" && (
        <Stack spacing={3} sx={{ maxWidth: 800 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" fontWeight={600}>
              Questions
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleAddQuestion("MULTIPLE_CHOICE")}
                disabled={isPending}
                startIcon={<PlusCircle size={16} />}
              >
                Multiple Choice
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleAddQuestion("BOOLEAN")}
                disabled={isPending}
                startIcon={<PlusCircle size={16} />}
              >
                True/False
              </Button>
            </Stack>
          </Box>

          <QuestionList
            items={quiz.questions}
            courseId={courseId}
            lessonId={lessonId}
            quizId={quiz.id}
            onReorder={handleReorder}
          />
        </Stack>
      )}
    </Stack>
  );
};

