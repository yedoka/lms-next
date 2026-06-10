"use client";

import { useState } from "react";
import { useNotifications } from "../hooks/use-notifications";
import { Bell } from "lucide-react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import type { Notification } from "@prisma/client";

const TYPE_LABELS: Record<string, string> = {
  GRADE: "Grade updated",
  LESSON: "New lesson",
  ENROLLMENT: "Enrollment confirmed",
};

function NotificationItem({ notification }: { notification: Notification }) {
  const label = TYPE_LABELS[notification.type] ?? notification.type;
  const isUnread = !notification.readAt;

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        bgcolor: isUnread ? "action.hover" : "transparent",
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Typography variant="caption" fontWeight={600} color="primary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {notification.message}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {new Date(notification.createdAt).toLocaleString()}
      </Typography>
    </Box>
  );
}

export function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  return (
    <>
      <IconButton onClick={handleOpen} size="small" aria-label="Notifications">
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}
        >
          <Bell size={20} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 340,
              maxHeight: 440,
              display: "flex",
              flexDirection: "column",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: 3,
              borderRadius: 2,
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
            {unreadCount > 0 && (
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 1, color: "text.secondary" }}
              >
                ({unreadCount} unread)
              </Typography>
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              sx={{ fontSize: 12, p: 0.5, minWidth: 0 }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* List */}
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          {notifications.length === 0 ? (
            <Box
              sx={{
                px: 2,
                py: 4,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <Typography variant="body2">No notifications yet</Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))
          )}
        </Box>
      </Popover>
    </>
  );
}
