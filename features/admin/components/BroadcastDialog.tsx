"use client";

import { useState, useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { broadcastAnnouncement } from "@/features/admin/actions/admin-actions";
import type { BroadcastData } from "@/features/admin/schemas/schema";

const TARGETS = [
  { value: "ALL", label: "All users" },
  { value: "STUDENT", label: "Students" },
  { value: "TEACHER", label: "Teachers" },
  { value: "ADMIN", label: "Admins" },
] as const;

export function BroadcastDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] =
    useState<BroadcastData["targetRole"]>("ALL");
  const [isPending, startTransition] = useTransition();

  const close = () => {
    if (isPending) return;
    setOpen(false);
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    startTransition(async () => {
      try {
        const res = await broadcastAnnouncement({ message: message.trim(), targetRole });
        toast.success(`Announcement sent to ${res.count} user(s)`);
        setMessage("");
        setTargetRole("ALL");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send announcement");
      }
    });
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Megaphone size={16} />}
        onClick={() => setOpen(true)}
      >
        Send Announcement
      </Button>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>Broadcast Announcement</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Audience</InputLabel>
              <Select
                label="Audience"
                value={targetRole}
                onChange={(e) =>
                  setTargetRole(e.target.value as BroadcastData["targetRole"])
                }
                disabled={isPending}
              >
                {TARGETS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPending}
              multiline
              minRows={3}
              fullWidth
              inputProps={{ maxLength: 500 }}
              helperText={`${message.length}/500`}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={close} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={isPending || !message.trim()}
          >
            {isPending ? "Sending…" : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
