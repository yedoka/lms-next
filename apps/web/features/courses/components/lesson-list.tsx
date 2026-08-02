"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Lesson, Attachment, Quiz } from "@prisma/client";
import { LessonItem } from "./lesson-item";
import { reorderLessonsAction } from "../actions/lesson-actions";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface LessonListProps {
  items: (Lesson & { attachments: Attachment[]; quizzes: Quiz[] })[];
  courseId: string;
}

export const LessonList = ({ items, courseId }: LessonListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [lessons, setLessons] = useState(items);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setLessons(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = lessons.findIndex((item) => item.id === active.id);
      const newIndex = lessons.findIndex((item) => item.id === over?.id);

      const newOrder = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newOrder);

      const bulkUpdateData = newOrder.map((lesson, index) => ({
        id: lesson.id,
        position: index,
      }));

      startTransition(async () => {
        try {
          await reorderLessonsAction(courseId, bulkUpdateData);
          toast.success("Lessons reordered");
        } catch {
          toast.error("Something went wrong");
          setLessons(items); // Revert on error
        }
      });
    }
  };

  if (!isMounted) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={lessons} strategy={verticalListSortingStrategy}>
        <Stack spacing={1.5}>
          {lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              disabled={isPending}
            />
          ))}
          {lessons.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No lessons yet.
              </Typography>
            </Box>
          )}
        </Stack>
      </SortableContext>
    </DndContext>
  );
};

