"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lessonSchema, LessonFormData } from "@/features/courses/schemas/lesson";
import { VideoUpload } from "@/shared/components/video-upload";
import {
  createLessonAction,
  updateLessonAction,
  createLessonAttachmentAction,
  deleteLessonAttachmentAction,
} from "@/features/courses/actions/lesson-actions";
import { createQuizAction, deleteQuizAction } from "@/features/courses/actions/quiz-actions";
import { toast } from "sonner";
import { useTransition } from "react";
import { Attachment, Quiz } from "@prisma/client";
import { FileUpload } from "@/shared/components/file-upload";
import { FileText, X, BrainCircuit } from "lucide-react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

interface LessonFormProps {
  courseId: string;
  initialData?: LessonFormData & { id: string; attachments?: Attachment[]; quizzes?: Quiz[] };
  onSuccess?: () => void;
}

export const LessonForm = ({ courseId, initialData, onSuccess }: LessonFormProps) => {
  const [isPending, startTransition] = useTransition();

  const { register, control, handleSubmit, formState: { errors } } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      videoUrl: "",
      isPublished: false,
    },
  });

  const onSubmit = (data: LessonFormData) => {
    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updateLessonAction(courseId, initialData.id, data);
          toast.success("Lesson updated");
        } else {
          await createLessonAction(courseId, data);
          toast.success("Lesson created");
        }
        onSuccess?.();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Something went wrong");
        }
      }
    });
  };

  const handleUploadAttachment = (result: { url: string; name: string; size: number }) => {
    if (!initialData?.id) return;

    startTransition(async () => {
      try {
        await createLessonAttachmentAction(courseId, initialData.id, result.name, result.url, result.size);
        toast.success("Attachment uploaded");
      } catch (error) {
        toast.error("Failed to upload attachment");
      }
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    startTransition(async () => {
      try {
        await deleteLessonAttachmentAction(courseId, attachmentId);
        toast.success("Attachment deleted");
      } catch (error) {
        toast.error("Failed to delete attachment");
      }
    });
  };

  const handleCreateQuiz = () => {
    if (!initialData?.id) return;

    startTransition(async () => {
      try {
        await createQuizAction(courseId, initialData.id, {
          title: "New Quiz",
          timeLimit: null,
          passingScore: 70,
          isPublished: false,
        });
        toast.success("Quiz created");
      } catch (error) {
        toast.error("Failed to create quiz");
      }
    });
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (!initialData?.id) return;

    startTransition(async () => {
      try {
        await deleteQuizAction(courseId, initialData.id, quizId);
        toast.success("Quiz deleted");
      } catch (error) {
        toast.error("Failed to delete quiz");
      }
    });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        {initialData ? "Update lesson details and video." : "Add a new lesson to your course."}
      </Typography>

      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
        <TextField
          {...register("title")}
          label="Lesson Title"
          disabled={isPending}
          placeholder="e.g. 'Introduction to the course'"
          fullWidth
          size="medium"
          error={!!errors.title}
          helperText={errors.title?.message}
        />

        <TextField
          {...register("description")}
          label="Lesson Description"
          multiline
          minRows={6}
          disabled={isPending}
          placeholder="Provide a detailed description of the lesson..."
          fullWidth
          size="medium"
          error={!!errors.description}
          helperText={errors.description?.message}
        />

        <Controller
          control={control}
          name="videoUrl"
          render={({ field }) => (
            <FormControl error={!!errors.videoUrl} fullWidth>
              <FormLabel sx={{ mb: 1, typography: "body2", fontWeight: 500, color: "text.primary" }}>
                Lesson Video
              </FormLabel>
              <VideoUpload
                value={field.value || ""}
                onChange={field.onChange}
                onRemove={() => field.onChange("")}
              />
              {errors.videoUrl?.message && (
                <FormHelperText>{errors.videoUrl.message}</FormHelperText>
              )}
            </FormControl>
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
                  Publish Lesson
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Make this lesson visible to students.
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
            {initialData ? "Save changes" : "Create lesson"}
          </Button>
        </Box>
      </Stack>

      {initialData?.id && (
        <Box sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Course Attachments
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Add files for your students to download.
          </Typography>

          <Stack spacing={1} sx={{ mb: 2 }}>
            {initialData.attachments && initialData.attachments.length > 0 ? (
              initialData.attachments.map((attachment) => (
                <Box
                  key={attachment.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    bgcolor: "secondary.main",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden", minWidth: 0 }}>
                    <FileText size={16} style={{ color: "var(--mui-palette-info-main)", flexShrink: 0 }} />
                    <Typography variant="body2" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {attachment.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    disabled={isPending}
                    sx={{ ml: 1 }}
                  >
                    <X size={16} />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                No attachments yet.
              </Typography>
            )}
          </Stack>

          <FileUpload onUpload={handleUploadAttachment} disabled={isPending} />
        </Box>
      )}

      {initialData?.id && (
        <Box sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Lesson Quiz
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Assess student understanding with a quiz.
          </Typography>

          {initialData.quizzes && initialData.quizzes.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                bgcolor: "secondary.main",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BrainCircuit size={16} style={{ color: "var(--mui-palette-info-main)" }} />
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {initialData.quizzes[0].title}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {initialData.quizzes[0].isPublished ? "Published" : "Draft"} • {initialData.quizzes[0].passingScore}% to pass
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  component={Link}
                  href={`/dashboard/teacher/courses/${courseId}/lessons/${initialData.id}/quiz`}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  component={Link}
                  href={`/dashboard/teacher/courses/${courseId}/lessons/${initialData.id}/quiz/preview`}
                >
                  Preview
                </Button>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteQuiz(initialData.quizzes![0].id)}
                  disabled={isPending}
                  sx={{ color: "error.main" }}
                >
                  <X size={16} />
                </IconButton>
              </Stack>
            </Box>
          ) : (
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={handleCreateQuiz}
              disabled={isPending}
            >
              Create Quiz
            </Button>
          )}
        </Box>
      )}
    </Stack>
  );
};

