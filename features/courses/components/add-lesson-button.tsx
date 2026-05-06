"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { LessonForm } from "./lesson-form";
import { useState } from "react";

interface AddLessonButtonProps {
  courseId: string;
}

export const AddLessonButton = ({ courseId }: AddLessonButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          New lesson
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-3xl overflow-y-auto max-h-[90vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Lesson</DialogTitle>
        </DialogHeader>
        <LessonForm 
          courseId={courseId} 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
