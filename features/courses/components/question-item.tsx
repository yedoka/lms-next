"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Question, Answer } from "@prisma/client";
import { GripVertical, Pencil, Trash } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
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
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-x-2 bg-slate-100 border-slate-200 border text-slate-700 rounded-md text-sm overflow-hidden"
    >
      <div
        className="px-2 py-3 border-r border-slate-200 hover:bg-slate-200 transition cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1 px-2 py-3 truncate">
        {question.text === "New Question" ? <span className="italic text-slate-400">Empty Question</span> : question.text}
      </div>
      <div className="ml-auto pr-2 flex items-center gap-x-2">
        <Badge variant="outline">
          {question.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : "True/False"}
        </Badge>
        
        <Dialog open={isEditing} onOpenChange={setIsEditing} modal={false}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1"
              disabled={isDeleting}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-3xl overflow-y-auto max-h-[90vh]"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            <QuestionForm
              courseId={courseId}
              lessonId={lessonId}
              question={question}
              onSuccess={() => setIsEditing(false)}
            />
          </DialogContent>
        </Dialog>

        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-destructive hover:text-destructive"
          disabled={isDeleting}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
