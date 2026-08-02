"use client";

import { useTransition } from "react";
import Button from "@mui/material/Button";
import { enrollInCourse } from "../actions/server-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
}

export const EnrollButton = ({ courseId }: EnrollButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      try {
        await enrollInCourse(courseId);
        toast.success("Enrolled successfully!");
      } catch (error) {
        toast.error("Something went wrong");
        console.error(error);
      }
    });
  };

  return (
    <Button
      onClick={onClick}
      disabled={isPending}
      variant="contained"
      fullWidth
      startIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
    >
      Enroll Now
    </Button>
  );
};
