"use client";

import { useState, useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import { toast } from "sonner";
import { updateUser } from "@/features/admin/actions/admin-actions";

type User = { id: string; name: string | null; email: string };

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export function EditUserDialog({ open, user, onClose }: Props) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const unchanged = name === (user.name ?? "") && email === user.email;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateUser(user.id, name, email);
        toast.success("User updated");
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update user");
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Name"
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
          />
          <TextField
            label="Email"
            size="small"
            fullWidth
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || unchanged || !name.trim() || !email.trim()}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
