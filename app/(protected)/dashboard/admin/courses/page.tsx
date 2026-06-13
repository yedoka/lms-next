import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { PageContainer, PageHeader } from "@/shared/components/ui";
import { getAllCourses } from "@/features/admin/services/admin-service";
import { CourseOversightTable } from "@/features/admin/components/CourseOversightTable";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default async function AdminCoursesPage() {
  await withRole(ROLE.ADMIN);

  const courses = await getAllCourses();

  return (
    <PageContainer>
      <PageHeader
        title="Course Oversight"
        description="View and manage all courses across all teachers."
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          <CourseOversightTable courses={courses} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
