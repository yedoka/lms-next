"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lesson, Attachment, Quiz } from "@prisma/client";
import { GripVertical, Pencil, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteLessonAction } from "../actions/lesson-actions";
import { toast } from "sonner";
import { LessonForm } from "./lesson-form";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";

interface LessonItemProps {
  lesson: Lesson & { attachments: Attachment[]; quizzes: Quiz[] };
  courseId: string;
  disabled?: boolean;
}

export const LessonItem = ({ lesson, courseId, disabled }: LessonItemProps) => {
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const onDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteLessonAction(courseId, lesson.id);
        toast.success("Lesson deleted");
      } catch {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.5,
          py: 2,
          borderRight: 1,
          borderColor: "divider",
          cursor: "grab",
          bgcolor: "action.hover",
          "&:hover": { bgcolor: "action.selected" },
          transition: "background-color 0.15s",
        }}
      >
        <GripVertical size={18} />
      </Box>
      <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1, px: 0.5 }}>
        {lesson.title}
      </Typography>
      <Box sx={{ ml: "auto", pr: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          label={lesson.isPublished ? "Published" : "Draft"}
          size="small"
          sx={{
            fontWeight: 600,
            height: 20,
            fontSize: 11,
            ...(lesson.isPublished
              ? { bgcolor: "rgba(35,131,226,0.1)", color: "info.main" }
              : { bgcolor: "secondary.main", color: "text.primary" }),
            border: "none",
          }}
        />

        <IconButton
          size="small"
          disabled={disabled || isDeleting}
          onClick={() => setIsEditing(true)}
          title="Edit Lesson"
        >
          <Pencil size={15} />
        </IconButton>

        <IconButton
          size="small"
          disabled={disabled || isDeleting}
          onClick={onDelete}
          title="Delete Lesson"
          sx={{ color: "error.main" }}
        >
          <Trash size={15} />
        </IconButton>
      </Box>

      <Dialog
        open={isEditing}
        onClose={() => !isDeleting && setIsEditing(false)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>Edit Lesson</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <LessonForm
            courseId={courseId}
            initialData={{
              ...lesson,
              description: lesson.description || "",
              videoUrl: lesson.videoUrl || "",
            }}
            onSuccess={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

