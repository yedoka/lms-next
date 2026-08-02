import { PlusCircle } from "lucide-react";
import { ROUTES } from "@/features/auth/utils/routes";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { getTeacherCourses } from "@/features/courses/services/service";
import { CourseTable } from "@/features/courses/components/course-table";
import { PageContainer, PageHeader } from "@/shared/components/ui";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default async function TeacherCoursesPage() {
  const session = await withRole([ROLE.TEACHER, ROLE.ADMIN]);
  const courses = await getTeacherCourses(session.user.id);

  return (
    <PageContainer>
      <PageHeader
        title="Manage Courses"
        description="Create and manage your educational content."
        actions={
          <Button
            variant="contained"
            href={ROUTES.DASHBOARD_TEACHER_COURSE_CREATE}
            startIcon={<PlusCircle size={16} />}
            size="small"
          >
            New Course
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Your Courses
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              You have created {courses.length} course{courses.length === 1 ? "" : "s"}.
            </Typography>
          </Box>
          <CourseTable courses={courses} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

