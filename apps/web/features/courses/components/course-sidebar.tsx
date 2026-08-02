import prisma from "@/shared/db/prisma";
import { PlayCircle, CheckCircle } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

export function SidebarSkeleton() {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: 320 },
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        height: { md: "calc(100vh - 64px)" },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Course Content
        </Typography>
      </Box>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    </Box>
  );
}

export async function CourseSidebar({
  courseId,
  lessonId,
  userId,
}: {
  courseId: string;
  lessonId: string;
  userId: string;
}) {
  const lessons = await prisma.lesson.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    orderBy: {
      position: "asc",
    },
  });

  const userProgress = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: {
        in: lessons.map((l) => l.id),
      },
      isCompleted: true,
    },
  });

  const completedLessonIds = new Set(userProgress.map((p) => p.lessonId));

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 320 },
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        height: { md: "calc(100vh - 64px)" },
        overflowY: "auto",
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>
          Course Content
        </Typography>
      </Box>
      <List disablePadding sx={{ p: 1 }}>
        {lessons.map((l) => {
          const isLessonCompleted = completedLessonIds.has(l.id);
          const isSelected = l.id === lessonId;

          return (
            <ListItemButton
              key={l.id}
              href={`/courses/${courseId}/lessons/${l.id}`}
              selected={isSelected}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {isLessonCompleted ? (
                  <CheckCircle size={20} style={{ color: isSelected ? "inherit" : "var(--mui-palette-success-main)" }} />
                ) : (
                  <PlayCircle size={20} style={{ color: isSelected ? "inherit" : "var(--mui-palette-text-secondary)" }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={l.title}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: 500,
                  noWrap: true,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

