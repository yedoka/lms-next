import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { PlayCircle, Trophy } from "lucide-react";
import { ROUTES } from "@/features/auth/utils/routes";

export interface ContinueLearningTarget {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  completedCount: number;
  totalLessons: number;
  progressPercentage: number;
}

interface ContinueLearningCardProps {
  target: ContinueLearningTarget | null;
  /** True when the student is enrolled somewhere but has no lesson left to take. */
  allCoursesComplete: boolean;
}

export function ContinueLearningCard({
  target,
  allCoursesComplete,
}: ContinueLearningCardProps) {
  if (!target) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent
          sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}
        >
          <Trophy size={24} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {allCoursesComplete
                ? "Every lesson is done"
                : "Nothing to continue yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {allCoursesComplete
                ? "You have finished all lessons in your courses."
                : "Enroll in a course to start learning."}
            </Typography>
          </Box>
          <Button variant="contained" href={ROUTES.COURSES}>
            Browse Catalog
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Continue learning
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mt: 0.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {target.lessonTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {target.courseTitle}
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<PlayCircle size={18} />}
            href={ROUTES.COURSE_LESSON(target.courseId, target.lessonId)}
            sx={{ flexShrink: 0 }}
          >
            Resume
          </Button>
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {target.completedCount} of {target.totalLessons} lessons complete
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {target.progressPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={target.progressPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
