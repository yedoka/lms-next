"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { CheckCircle2, ClipboardCheck, AlertCircle } from "lucide-react";
import type {
  ActivityEvent,
  ActivityEventKind,
} from "../services/student-activity-service";

const ICONS: Record<ActivityEventKind, typeof CheckCircle2> = {
  lesson_completed: CheckCircle2,
  quiz_submitted: ClipboardCheck,
  regrade: AlertCircle,
};

const ICON_COLORS: Record<ActivityEventKind, string> = {
  lesson_completed: "success.main",
  quiz_submitted: "info.main",
  regrade: "warning.main",
};

interface StudentActivityFeedProps {
  events: ActivityEvent[];
}

export function StudentActivityFeed({ events }: StudentActivityFeedProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Recent Activity
        </Typography>

        {events.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 5, textAlign: "center" }}
          >
            Your completed lessons and quiz results will show up here.
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 320, overflowY: "auto" }}>
            {events.map((event) => {
              const Icon = ICONS[event.kind];

              const text = (
                <ListItemText
                  primary={event.title}
                  secondary={
                    <>
                      {event.detail ? `${event.detail} · ` : ""}
                      {timeAgo(event.at)}
                    </>
                  }
                  primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              );

              return (
                <ListItem key={event.id} disableGutters alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                    <Box sx={{ color: ICON_COLORS[event.kind], display: "flex" }}>
                      <Icon size={16} />
                    </Box>
                  </ListItemIcon>
                  {event.href ? (
                    <Link
                      href={event.href}
                      style={{ color: "inherit", textDecoration: "none", flex: 1 }}
                    >
                      {text}
                    </Link>
                  ) : (
                    text
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
