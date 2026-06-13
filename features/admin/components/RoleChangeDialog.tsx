"use client";

import { useState, useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import { updateUserRole } from "@/features/admin/actions/admin-actions";

interface Props {
  open: boolean;
  user: { id: string; name: string | null; email: string; role: string } | null;
  onClose: () => void;
}

const ROLES = ["STUDENT", "TEACHER", "ADMIN"] as const;

export function RoleChangeDialog({ open, user, onClose }: Props) {
  const [selectedRole, setSelectedRole] = useState(user?.role ?? "STUDENT");
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const handleSave = () => {
    if (selectedRole === user.role) {
      onClose();
      return;
    }
    startTransition(async () => {
      try {
        await updateUserRole(user.id, selectedRole);
        toast.success(`Role updated to ${selectedRole}`);
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update role");
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Role</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user.name ?? user.email}
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isPending}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || selectedRole === user.role}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
