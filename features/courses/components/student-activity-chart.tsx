"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import type { WeeklyActivityPoint } from "../services/student-activity-service";

/**
 * Categorical hues, fixed order — lessons first, quizzes second. Validated as a
 * pair against both chart surfaces: adjacent ΔE 24.5 normal vision, 23.3 under
 * deuteranopia, contrast >= 3:1 on the light and dark surface alike, so one set
 * serves both schemes. The greens carried by StatCard read as gray at chart
 * scale (chroma below the floor), which is why this is not the palette token.
 */
const SERIES_COLORS = {
  lessons: "#2383e2",
  quizzes: "#1f9d55",
} as const;

interface StudentActivityChartProps {
  points: WeeklyActivityPoint[];
}

export function StudentActivityChart({ points }: StudentActivityChartProps) {
  const theme = useTheme();

  const lessons = points.map((point) => point.lessons);
  const quizzes = points.map((point) => point.quizzes);
  const labels = points.map((point) => point.week.slice(5).replace("-", "/"));
  const total = [...lessons, ...quizzes].reduce((acc, n) => acc + n, 0);

  const tickLabelStyle = {
    fill: theme.vars.palette.text.secondary,
    fontSize: 11,
  };

  // Per-item hover drops the x value that an axis tooltip would have shown, so
  // the week is folded into the formatted value instead.
  const formatValue = (value: number | null, dataIndex: number) =>
    `${value ?? 0} · week of ${labels[dataIndex]}`;

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
              height: 260,
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
            height={260}
            series={[
              {
                data: lessons,
                label: "Lessons",
                color: SERIES_COLORS.lessons,
                stack: "activity",
                valueFormatter: (value, { dataIndex }) =>
                  formatValue(value, dataIndex),
              },
              {
                data: quizzes,
                label: "Quizzes",
                color: SERIES_COLORS.quizzes,
                stack: "activity",
                valueFormatter: (value, { dataIndex }) =>
                  formatValue(value, dataIndex),
              },
            ]}
            xAxis={[
              {
                data: labels,
                scaleType: "band",
                disableLine: true,
                disableTicks: true,
                // 12 weekly labels collide at card width; every other one keeps
                // the axis readable and still dates each visible bar.
                tickInterval: (_, index) => index % 2 === 0,
                tickLabelStyle,
                categoryGapRatio: 0.45,
              },
            ]}
            yAxis={[
              {
                disableLine: true,
                disableTicks: true,
                // Counts are whole; without this the axis invents 0.5 steps on
                // low-activity weeks.
                tickMinStep: 1,
                tickLabelStyle,
              },
            ]}
            borderRadius={6}
            grid={{ horizontal: true }}
            // The default band highlight paints a gray column and pops a
            // tooltip on empty weeks reading "0 / 0". Per-item hover only.
            axisHighlight={{ x: "none" }}
            slotProps={{
              tooltip: { trigger: "item" },
              legend: {
                position: { vertical: "top", horizontal: "end" },
                sx: {
                  gap: 2,
                  "& .MuiChartsLegend-series text": {
                    fontSize: "12px !important",
                    fill: `${theme.vars.palette.text.secondary} !important`,
                  },
                },
              },
            }}
            // Top margin clears the highest tick label, which the legend row
            // would otherwise crop.
            margin={{ top: 16, right: 8, bottom: 0, left: 0 }}
            sx={{
              "& .MuiChartsGrid-line": {
                stroke: theme.vars.palette.divider,
                strokeDasharray: "3 3",
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
