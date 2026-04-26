"use client";

import { useTransition } from "react";
import { Button } from "@/shared/ui/button";
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
      className="w-full"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : null}
      Enroll Now
    </Button>
  );
};
