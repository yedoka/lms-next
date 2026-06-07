import { auth } from "@/auth";
import { getStudentCourses } from "@/features/courses/services/service";
import Link from "next/link";
import { ROUTES } from "@/features/auth/utils/routes";
import { BookOpen } from "lucide-react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { PageContainer, PageHeader, EmptyState } from "@/shared/components/ui";

export default async function StudentCoursesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const courses = await getStudentCourses(session.user.id);

  return (
    <PageContainer>
      <PageHeader
        title="My Courses"
        description="Manage and continue your learning progress."
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No courses found"
          description="You are currently enrolled in 0 courses."
          action={
            <Button variant="contained" href={ROUTES.COURSES}>
              Browse the catalog to get started
            </Button>
          }
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {courses.map((course) => (
            <Link
              key={course.id}
              href={ROUTES.COURSE_DETAILS(course.id)}
              style={{ textDecoration: "none" }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                }}
              >
                <Box
                  sx={{
                    aspectRatio: "16/9",
                    position: "relative",
                    bgcolor: "secondary.main",
                    overflow: "hidden",
                  }}
                >
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        No Image
                      </Typography>
                    </Box>
                  )}
                </Box>
                <CardContent sx={{ flex: "none", p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Chip
                      label={course.category || "Uncategorized"}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {course._count.lessons} Lessons
                    </Typography>
                  </Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mb: 0.5,
                    }}
                  >
                    {course.title}
                  </Typography>
                </CardContent>
                <CardContent sx={{ mt: "auto", p: 2, pt: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    By {course.teacher?.name || "Unknown Teacher"}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Box>
      )}
    </PageContainer>
  );
}
