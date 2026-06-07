import { requireAuth } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import { CourseForm } from "@/features/courses/components/course-form";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import { PageContainer, PageHeader } from "@/shared/components/ui";

export default async function CreateCoursePage() {
  const session = await requireAuth();

  if (session.user.role !== ROLE.TEACHER && session.user.role !== ROLE.ADMIN) {
    redirect("/forbidden");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Name your course"
        description="What would you like to name your course? Don&apos;t worry, you can change this later."
      />
      <Box sx={{ maxWidth: 600, mt: 4 }}>
        <CourseForm />
      </Box>
    </PageContainer>
  );
}

