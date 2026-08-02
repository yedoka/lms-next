"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import { requestRole } from "@/features/admin/actions/role-request-actions";

interface Props {
  hasPending: boolean;
}

export function RequestRoleCard({ hasPending: initialPending }: Props) {
  const [hasPending, setHasPending] = useState(initialPending);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (hasPending) {
    return (
      <Alert severity="info">
        Your request to become a teacher is pending admin review.
      </Alert>
    );
  }

  const submit = () => {
    startTransition(async () => {
      try {
        await requestRole({ requestedRole: "TEACHER", reason: reason.trim() || undefined });
        toast.success("Request submitted for review");
        setHasPending(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to submit request");
      }
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        Want to create and teach courses? Request the teacher role and an admin
        will review your application.
      </Typography>
      <TextField
        label="Why do you want to teach? (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={isPending}
        multiline
        minRows={2}
        fullWidth
        inputProps={{ maxLength: 500 }}
      />
      <Box>
        <Button variant="contained" onClick={submit} disabled={isPending}>
          {isPending ? "Submitting…" : "Request Teacher Role"}
        </Button>
      </Box>
    </Box>
  );
}
