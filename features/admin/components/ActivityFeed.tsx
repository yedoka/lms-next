"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import { UserPlus, BookOpen, ClipboardCheck, Radio } from "lucide-react";
import { useAdminFeed, type AdminEvent } from "@/features/admin/hooks/use-admin-feed";

const ICONS: Record<AdminEvent["kind"], typeof UserPlus> = {
  signup: UserPlus,
  enrollment: BookOpen,
  quiz_completed: ClipboardCheck,
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function ActivityFeed() {
  const { events } = useAdminFeed();

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Radio size={16} className="text-emerald-500" />
          <Typography variant="subtitle2" fontWeight={600}>
            Live Activity
          </Typography>
        </Box>

        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            Waiting for activity…
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 360, overflowY: "auto" }}>
            {events.map((e, i) => {
              const Icon = ICONS[e.kind] ?? Radio;
              return (
                <ListItem key={`${e.at}-${i}`} disableGutters>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Icon size={16} />
                  </ListItemIcon>
                  <ListItemText
                    primary={e.label}
                    secondary={timeAgo(e.at)}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
