"use client";

import Image from "next/image";
import { ROUTES } from "@/features/auth/utils/routes";
import { CheckCircle2, PlayCircle } from "lucide-react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";

export interface EnrolledCourseCardProps {
  courseId: string;
  title: string;
  thumbnail: string | null;
  category: string | null;
  teacherName: string;
  totalLessons: number;
  completedCount: number;
  progressPercentage: number;
  nextLessonId: string | null;
  bestQuizScore: number | null;
}

export function EnrolledCourseCard({
  courseId,
  title,
  thumbnail,
  category,
  teacherName,
  totalLessons,
  completedCount,
  progressPercentage,
  nextLessonId,
  bestQuizScore,
}: EnrolledCourseCardProps) {
  const isCompleted = progressPercentage === 100;

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Thumbnail Image */}
      <Box sx={{ position: "relative", width: "100%", pt: "56.25%", bgcolor: "secondary.main", overflow: "hidden" }}>
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            priority
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              No image
            </Typography>
          </Box>
        )}
        {bestQuizScore !== null && (
          <Box sx={{ position: "absolute", top: 8, right: 8 }}>
            <Chip
              icon={<CheckCircle2 size={12} style={{ color: "var(--mui-palette-success-main)" }} />}
              label={`Quiz: ${bestQuizScore}%`}
              size="small"
              sx={{
                bgcolor: "background.paper",
                backdropFilter: "blur(4px)",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                fontSize: 11,
                fontWeight: 600,
                "& .MuiChip-label": { pl: 1 },
                "& .MuiChip-icon": { ml: 0.5 },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Header Info */}
      <CardContent sx={{ flex: 1, p: 2, pb: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          {category ? (
            <Chip label={category} size="small" sx={{ fontWeight: 400 }} />
          ) : (
            <Box />
          )}
          {isCompleted && (
            <Chip
              icon={<CheckCircle2 size={12} style={{ color: "var(--mui-palette-success-main)" }} />}
              label="Completed"
              size="small"
              sx={{
                bgcolor: "rgba(68,131,97,0.1)",
                color: "success.main",
                fontWeight: 600,
                border: "none",
                fontSize: 11,
                "& .MuiChip-label": { pl: 1 },
                "& .MuiChip-icon": { ml: 0.5 },
              }}
            />
          )}
        </Box>
        <Typography
          variant="subtitle2"
          component="h3"
          fontWeight={600}
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.4,
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: "auto" }}>
          {teacherName}
        </Typography>
      </CardContent>

      {/* Progress */}
      <CardContent sx={{ p: 2, pt: 0, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {completedCount} of {totalLessons} lessons
          </Typography>
          <Typography variant="caption" fontWeight={600} color="text.primary">
            {progressPercentage}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progressPercentage} sx={{ height: 6, borderRadius: 3 }} />
      </CardContent>

      {/* Action Footer */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        {isCompleted ? (
          <Button href={ROUTES.COURSE_DETAILS(courseId)} variant="outlined" fullWidth size="small">
            Review Course
          </Button>
        ) : (
          <Button
            href={
              nextLessonId ? ROUTES.COURSE_LESSON(courseId, nextLessonId) : ROUTES.COURSE_DETAILS(courseId)
            }
            variant="contained"
            fullWidth
            size="small"
            startIcon={<PlayCircle size={16} />}
          >
            {completedCount === 0 ? "Start Learning" : "Continue Learning"}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

