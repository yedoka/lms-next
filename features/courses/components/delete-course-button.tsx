"use client";

import { useState, useTransition } from "react";
import { Trash } from "lucide-react";
import { deleteCourse } from "@/features/courses/actions/server-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";

interface DeleteCourseButtonProps {
  courseId: string;
  courseTitle: string;
}

export const DeleteCourseButton = ({
  courseId,
  courseTitle,
}: DeleteCourseButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    startTransition(async () => {
      try {
        await deleteCourse(courseId);
        toast.success("Course deleted");
        setOpen(false);
        router.refresh();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Something went wrong");
        }
      }
    });
  };

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Delete course"
        sx={{ color: "error.main" }}
        size="small"
      >
        <Trash size={16} />
      </IconButton>
      <Dialog open={open} onClose={() => !isPending && setOpen(false)}>
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2" color="text.secondary">
            Are you sure you want to delete &quot;{courseTitle}&quot;? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setOpen(false)}
            disabled={isPending}
            size="small"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onDelete}
            disabled={isPending}
            size="small"
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

