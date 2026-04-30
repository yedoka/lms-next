"use client";

import { useEffect, useState } from "react";
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
import { Question, Answer } from "@prisma/client";
import { QuestionItem } from "./question-item";

interface QuestionListProps {
  items: (Question & { answers: Answer[] })[];
  courseId: string;
  lessonId: string;
  quizId: string;
  onReorder: (updates: { id: string; position: number }[]) => void;
}

export const QuestionList = ({
  items,
  courseId,
  lessonId,
  quizId,
  onReorder,
}: QuestionListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [questions, setQuestions] = useState(items);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setQuestions(items);
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
      const oldIndex = questions.findIndex((item) => item.id === active.id);
      const newIndex = questions.findIndex((item) => item.id === over?.id);

      const newOrder = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newOrder);

      const bulkUpdateData = newOrder.map((question, index) => ({
        id: question.id,
        position: index,
      }));

      onReorder(bulkUpdateData);
    }
  };

  if (!isMounted) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={questions} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              courseId={courseId}
              lessonId={lessonId}
              quizId={quizId}
            />
          ))}
          {questions.length === 0 && (
            <div className="text-center text-muted-foreground py-10 border border-dashed rounded-md">
              No questions yet. Add one to get started.
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};
