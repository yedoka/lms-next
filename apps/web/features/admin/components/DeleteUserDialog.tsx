"use client";

import { useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import { deleteUser } from "@/features/admin/actions/admin-actions";

interface Props {
  open: boolean;
  user: { id: string; name: string | null; email: string } | null;
  onClose: () => void;
}

export function DeleteUserDialog({ open, user, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteUser(user.id);
        toast.success("User deleted");
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete user");
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2">
          Are you sure you want to delete{" "}
          <strong>{user.name ?? user.email}</strong>? This will permanently
          remove their account, enrollments, progress, and quiz history.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
