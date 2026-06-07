"use client";

import { Question, Answer } from "@prisma/client";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, QuestionFormData } from "../schemas/quiz";
import { toast } from "sonner";
import {
  updateQuestionAction,
  createAnswerAction,
  updateAnswerAction,
  deleteAnswerAction,
  setCorrectAnswerAction,
} from "../actions/quiz-actions";
import { PlusCircle, Trash, CheckCircle } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

interface QuestionFormProps {
  question: Question & { answers: Answer[] };
  courseId: string;
  lessonId: string;
  onSuccess?: () => void;
}

export const QuestionForm = ({
  question,
  courseId,
  lessonId,
  onSuccess,
}: QuestionFormProps) => {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionFormData>({
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
        await setCorrectAnswerAction(courseId, lessonId, question.id, answerId);
      } catch (error) {
        toast.error("Failed to set correct answer");
      }
    });
  };

  return (
    <Stack spacing={4}>
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <TextField
              {...field}
              label="Question Text"
              disabled={isPending}
              fullWidth
              size="small"
              error={!!errors.text}
              helperText={errors.text?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="points"
          render={({ field }) => (
            <TextField
              label="Points"
              type="number"
              disabled={isPending}
              fullWidth
              size="small"
              value={field.value}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
              error={!!errors.points}
              helperText={errors.points?.message}
              slotProps={{ htmlInput: { min: 1 } }}
            />
          )}
        />
        <Box>
          <Button disabled={isPending} type="submit" variant="contained">
            Save Question Details
          </Button>
        </Box>
      </Stack>

      <Box sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Answers
          </Typography>
          {question.type === "MULTIPLE_CHOICE" && (
            <Button
              size="small"
              variant="outlined"
              onClick={handleAddAnswer}
              disabled={isPending}
              startIcon={<PlusCircle size={16} />}
            >
              Add Option
            </Button>
          )}
        </Box>

        <Stack spacing={2} sx={{ mb: 1 }}>
          {question.answers.map((answer) => (
            <Box
              key={answer.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                border: 1,
                borderRadius: 1.5,
                borderColor: answer.isCorrect ? "success.main" : "divider",
                bgcolor: answer.isCorrect ? "rgba(68, 131, 97, 0.08)" : "background.paper",
              }}
            >
              <IconButton
                type="button"
                size="small"
                onClick={() => handleSetCorrect(answer.id)}
                disabled={isPending}
                sx={{
                  color: answer.isCorrect ? "success.main" : "text.disabled",
                }}
              >
                <CheckCircle size={20} />
              </IconButton>

              {question.type === "MULTIPLE_CHOICE" ? (
                <TextField
                  fullWidth
                  size="small"
                  defaultValue={answer.text}
                  onBlur={(e) => handleUpdateAnswerText(answer.id, e.target.value)}
                  disabled={isPending}
                  sx={{
                    bgcolor: "background.paper",
                    "& .MuiOutlinedInput-root": {
                      height: 36,
                    }
                  }}
                />
              ) : (
                <Typography variant="body2" sx={{ flex: 1, px: 1.5, fontWeight: 500 }}>
                  {answer.text}
                </Typography>
              )}

              {question.type === "MULTIPLE_CHOICE" && question.answers.length > 2 && (
                <IconButton
                  type="button"
                  size="small"
                  onClick={() => handleDeleteAnswer(answer.id)}
                  disabled={isPending}
                  sx={{ color: "error.main" }}
                >
                  <Trash size={16} />
                </IconButton>
              )}
            </Box>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Click the checkmark circle to mark an answer as correct.
        </Typography>
      </Box>
    </Stack>
  );
};
