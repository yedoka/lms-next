"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Question, Answer } from "@prisma/client";
import { GripVertical, Pencil, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { QuestionForm } from "./question-form";
import { deleteQuestionAction } from "../actions/quiz-actions";

interface QuestionItemProps {
  question: Question & { answers: Answer[] };
  courseId: string;
  lessonId: string;
  quizId: string;
}

export const QuestionItem = ({ question, courseId, lessonId, quizId }: QuestionItemProps) => {
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const onDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteQuestionAction(courseId, lessonId, question.id);
        toast.success("Question deleted");
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
        gap: 1,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 1.5,
          borderRight: 1,
          borderColor: "divider",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </Box>

      <Typography
        variant="body2"
        sx={{
          flex: 1,
          px: 1.5,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          ...(question.text === "New Question" && {
            fontStyle: "italic",
            color: "text.disabled",
          }),
        }}
      >
        {question.text === "New Question" ? "Empty Question" : question.text}
      </Typography>

      <Box sx={{ ml: "auto", pr: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          label={question.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : "True/False"}
          size="small"
          variant="outlined"
          sx={{ height: 20, fontSize: "0.75rem" }}
        />

        <IconButton
          size="small"
          onClick={() => setIsEditing(true)}
          disabled={isDeleting}
        >
          <Pencil size={15} />
        </IconButton>

        <IconButton
          size="small"
          onClick={onDelete}
          disabled={isDeleting}
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
        <DialogTitle>Edit Question</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <QuestionForm
            courseId={courseId}
            lessonId={lessonId}
            question={question}
            onSuccess={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
