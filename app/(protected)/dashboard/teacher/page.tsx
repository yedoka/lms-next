import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { PlusCircle } from "lucide-react";
import { CourseTable } from "@/features/courses/components/course-table";
import { getTeacherCourses } from "@/features/courses/services/service";
import { PageContainer, PageHeader } from "@/shared/components/ui";

export default async function TeacherDashboardPage() {
  const session = await withRole([ROLE.TEACHER, ROLE.ADMIN]);
  const courses = await getTeacherCourses(session.user.id);

  return (
    <PageContainer>
      <PageHeader
        title="Teacher Dashboard"
        actions={
          <Button
            variant="contained"
            href="/dashboard/teacher/courses/create"
            startIcon={<PlusCircle size={16} />}
          >
            Create Course
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Typography variant="subtitle2" sx={{ p: 2, pb: 0 }}>
            My Courses
          </Typography>
          <CourseTable courses={courses} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
