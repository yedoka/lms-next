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
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              disabled={isPending}
            />
          ))}
          {lessons.length === 0 && (
            <div className="text-center text-muted-foreground py-10 border border-dashed rounded-md">
              No lessons yet.
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};
