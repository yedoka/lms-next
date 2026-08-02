"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import { Gauge } from "@mui/x-charts/Gauge";
import type {
  TimeSeriesPoint,
  PassRateStats,
} from "@/features/admin/services/admin-service";

interface Props {
  signups: TimeSeriesPoint[];
  enrollments: TimeSeriesPoint[];
  passRate: PassRateStats;
  days: number;
}

// Fill missing days with 0 so the axis is continuous
function fillSeries(points: TimeSeriesPoint[], days: number) {
  const map = new Map(points.map((p) => [p.date, p.count]));
  const labels: string[] = [];
  const values: number[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  for (let i = 0; i <= days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    labels.push(key.slice(5)); // MM-DD
    values.push(map.get(key) ?? 0);
  }
  return { labels, values };
}

function TrendCard({
  title,
  color,
  points,
  days,
}: {
  title: string;
  color: string;
  points: TimeSeriesPoint[];
  days: number;
}) {
  const { labels, values } = fillSeries(points, days);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {total} in the last {days} days
        </Typography>
        <LineChart
          height={220}
          xAxis={[{ data: labels, scaleType: "point" }]}
          series={[{ data: values, area: true, color, showMark: false }]}
          margin={{ top: 16, right: 16, bottom: 24, left: 32 }}
        />
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts({ signups, enrollments, passRate, days }: Props) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 2fr 1fr" },
          gap: 2,
        }}
      >
        <TrendCard
          title="New Signups"
          color="#2196f3"
          points={signups}
          days={days}
        />
        <TrendCard
          title="New Enrollments"
          color="#4caf50"
          points={enrollments}
          days={days}
        />
        <Card>
          <CardContent
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Quiz Pass Rate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {passRate.passed} / {passRate.total} attempts passed
            </Typography>
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
              <Gauge
                value={passRate.rate}
                valueMax={100}
                text={({ value }) => `${value}%`}
                width={160}
                height={160}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
