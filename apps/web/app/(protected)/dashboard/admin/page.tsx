import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { PageContainer, PageHeader, StatCard } from "@/shared/components/ui";
import {
  getPlatformStats,
  getRecentUsers,
  getRecentCourses,
  getSignupsOverTime,
  getEnrollmentsOverTime,
  getQuizPassRate,
} from "@/features/admin/services/admin-service";
import { AnalyticsCharts } from "@/features/admin/components/AnalyticsCharts";
import { ActivityFeed } from "@/features/admin/components/ActivityFeed";
import { PresencePanel } from "@/features/admin/components/PresencePanel";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { Users, BookOpen, GraduationCap, ClipboardList } from "lucide-react";

const roleColor = {
  ADMIN: "error",
  TEACHER: "warning",
  STUDENT: "default",
} as const;

export default async function AdminDashboardPage() {
  await withRole(ROLE.ADMIN);

  const ANALYTICS_DAYS = 30;
  const [
    stats,
    recentUsers,
    recentCourses,
    signups,
    enrollments,
    passRate,
  ] = await Promise.all([
    getPlatformStats(),
    getRecentUsers(5),
    getRecentCourses(5),
    getSignupsOverTime(ANALYTICS_DAYS),
    getEnrollmentsOverTime(ANALYTICS_DAYS),
    getQuizPassRate(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Admin Dashboard"
        description="Platform overview and recent activity."
      />

      {/* KPI Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          icon={<Users />}
          label="Total Users"
          value={stats.totalUsers}
          color="info"
        />
        <StatCard
          icon={<BookOpen />}
          label="Total Courses"
          value={stats.totalCourses}
          color="success"
        />
        <StatCard
          icon={<GraduationCap />}
          label="Enrollments"
          value={stats.totalEnrollments}
          color="warning"
        />
        <StatCard
          icon={<ClipboardList />}
          label="Quiz Attempts"
          value={stats.totalAttempts}
          color="default"
        />
      </Box>

      {/* Analytics charts */}
      <AnalyticsCharts
        signups={signups}
        enrollments={enrollments}
        passRate={passRate}
        days={ANALYTICS_DAYS}
      />

      {/* Real-time: presence + live activity feed */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <PresencePanel />
        <ActivityFeed />
      </Box>

      {/* Recent activity */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        {/* Recent Users */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Recent Users
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name ?? "—"}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.role}
                        size="small"
                        color={roleColor[u.role] ?? "default"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Recent Courses
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell align="right">Students</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentCourses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                        {c.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                      {c.teacher.name ?? c.teacher.email}
                    </TableCell>
                    <TableCell align="right">{c._count.enrollments}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
