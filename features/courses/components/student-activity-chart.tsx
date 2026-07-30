"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import type { WeeklyActivityPoint } from "../services/student-activity-service";

interface StudentActivityChartProps {
  points: WeeklyActivityPoint[];
}

export function StudentActivityChart({ points }: StudentActivityChartProps) {
  const lessons = points.map((point) => point.lessons);
  const quizzes = points.map((point) => point.quizzes);
  const labels = points.map((point) => point.week.slice(5).replace("-", "/"));
  const total = [...lessons, ...quizzes].reduce((acc, n) => acc + n, 0);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Weekly Activity
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {total === 0
            ? `No activity in the last ${points.length} weeks`
            : `${total} lessons and quizzes over the last ${points.length} weeks`}
        </Typography>

        {total === 0 ? (
          <Box
            sx={{
              height: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Complete a lesson to start the chart.
            </Typography>
          </Box>
        ) : (
          <BarChart
            height={240}
            xAxis={[{ data: labels, scaleType: "band" }]}
            series={[
              { data: lessons, label: "Lessons", color: "#2383e2", stack: "a" },
              { data: quizzes, label: "Quizzes", color: "#448361", stack: "a" },
            ]}
            margin={{ top: 16, right: 16, bottom: 24, left: 32 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
