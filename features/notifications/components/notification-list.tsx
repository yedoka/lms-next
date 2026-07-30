"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { Bell } from "lucide-react";
import type { Notification } from "@prisma/client";
import { markAllAsReadAction } from "../actions/notification-actions";
import { notificationTypeLabel } from "../utils/type-labels";

type Filter = "all" | "unread";

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const visible =
    filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsReadAction();
      // The list is server-rendered, so the read state has to come back from
      // the server rather than being patched in local state.
      router.refresh();
    });
  };

  return (
    <Card>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Tabs
          value={filter}
          onChange={(_, value: Filter) => setFilter(value)}
          sx={{ minHeight: 48 }}
        >
          <Tab label={`All (${notifications.length})`} value="all" />
          <Tab label={`Unread (${unreadCount})`} value="unread" />
        </Tabs>

        <Button
          size="small"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || isPending}
        >
          Mark all read
        </Button>
      </Box>

      {visible.length === 0 ? (
        <Box sx={{ px: 2, py: 8, textAlign: "center", color: "text.secondary" }}>
          <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <Typography variant="body2">
            {filter === "unread"
              ? "Nothing unread."
              : "No notifications yet."}
          </Typography>
        </Box>
      ) : (
        visible.map((notification) => {
          const isUnread = !notification.readAt;

          return (
            <Box
              key={notification.id}
              sx={{
                px: 2.5,
                py: 2,
                bgcolor: isUnread ? "action.hover" : "transparent",
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-child": { borderBottom: "none" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.25,
                }}
              >
                <Typography variant="caption" fontWeight={600} color="primary">
                  {notificationTypeLabel(notification.type)}
                </Typography>
                {isUnread && (
                  <Chip
                    label="New"
                    size="small"
                    color="error"
                    sx={{ height: 18, fontSize: 10, "& .MuiChip-label": { px: 0.75 } }}
                  />
                )}
              </Box>
              <Typography variant="body2">{notification.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(notification.createdAt).toLocaleString()}
              </Typography>
            </Box>
          );
        })
      )}
    </Card>
  );
}
