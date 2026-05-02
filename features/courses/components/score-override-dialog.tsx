"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "sonner";
import { overrideScoreAction } from "../actions/gradebook-actions";

interface ScoreOverrideDialogProps {
  courseId: string;
  attemptId: string | null;
  studentName: string;
  quizTitle: string;
  currentScore: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScoreOverrideDialog({
  courseId,
  attemptId,
  studentName,
  quizTitle,
  currentScore,
  isOpen,
  onClose,
  onSuccess,
}: ScoreOverrideDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [newScore, setNewScore] = useState<string>(
    currentScore !== null ? currentScore.toString() : "",
  );
  const [reason, setReason] = useState("");

  const handleOverride = () => {
    if (!attemptId) return;

    const score = parseInt(newScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Please enter a valid score between 0 and 100");
      return;
    }

    startTransition(async () => {
      try {
        await overrideScoreAction(courseId, attemptId, {
          newScore: score,
          reason,
        });
        toast.success("Score overridden successfully");
        onSuccess();
        onClose();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to override score";
        toast.error(message);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Quiz Score</DialogTitle>
          <DialogDescription>
            Adjusting score for <strong>{studentName}</strong> on{" "}
            <strong>{quizTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="score">New Score (%)</Label>
            <Input
              id="score"
              type="number"
              min="0"
              max="100"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for override..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleOverride} disabled={isPending}>
            {isPending ? "Applying..." : "Apply Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
