"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { LessonForm } from "./lesson-form";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";

interface AddLessonButtonProps {
  courseId: string;
}

export const AddLessonButton = ({ courseId }: AddLessonButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setOpen(true)}
        startIcon={<PlusCircle size={16} />}
      >
        New lesson
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>Create Lesson</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <LessonForm courseId={courseId} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

