"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { overrideScoreAction } from "../actions/gradebook-actions";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";

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
  const [newScore, setNewScore] = useState<string>("");
  const [reason, setReason] = useState("");

  // Reset/sync form values when dialog opens or score changes
  useEffect(() => {
    if (isOpen) {
      setNewScore(currentScore !== null ? currentScore.toString() : "");
      setReason("");
    }
  }, [isOpen, currentScore]);

  const handleOverride = () => {
    if (!attemptId) return;

    const score = parseInt(newScore, 10);
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
    <Dialog open={isOpen} onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>Override Quiz Score</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Adjusting score for <strong>{studentName}</strong> on{" "}
          <strong>{quizTitle}</strong>.
        </DialogContentText>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="New Score (%)"
            type="number"
            size="small"
            slotProps={{ htmlInput: { min: 0, max: 100 } }}
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            disabled={isPending}
            fullWidth
          />
          <TextField
            label="Reason (Optional)"
            placeholder="Enter reason for override..."
            multiline
            rows={3}
            size="small"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={isPending} size="small">
          Cancel
        </Button>
        <Button onClick={handleOverride} disabled={isPending} variant="contained" size="small">
          {isPending ? "Applying..." : "Apply Override"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

