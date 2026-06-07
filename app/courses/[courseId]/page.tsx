import { Suspense } from "react";
import prisma from "@/shared/db/prisma";
import { notFound } from "next/navigation";
import { sanitizeHtml } from "@/shared/lib/sanitize";
import { auth } from "@/auth";
import { EnrollButton } from "@/features/courses/components/enroll-button";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { PageContainer } from "@/shared/components/ui";

async function CourseContent({ courseId }: { courseId: string }) {
  const session = await auth();
  const userId = session?.user?.id;

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      isPublished: true,
    },
    include: {
      teacher: true,
      lessons: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!course) {
    return notFound();
  }

  const enrollment = userId
    ? await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      })
    : null;

  const firstLessonId = course.lessons[0]?.id;

  return (
    <PageContainer maxWidth="md">
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
        {/* Main content column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h2" component="h1" sx={{ mb: 1.5 }}>
            {course.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Created by {course.teacher?.name || "Unknown"} &bull;{" "}
            {course.category || "Uncategorized"}
          </Typography>

          <Box
            className="tiptap-content"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(course.description || "No description provided."),
            }}
            sx={{ mb: 4 }}
          />

          <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
            Course Content
          </Typography>

          {course.lessons.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No lessons available yet.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {course.lessons.map((lesson) => (
                <Box
                  key={lesson.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {lesson.title}
                  </Typography>
                  {enrollment && (
                    <Button
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      variant="text"
                      size="small"
                    >
                      View
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0 }}>
          <Card sx={{ position: "sticky", top: 80 }}>
            <Box
              sx={{
                position: "relative",
                paddingTop: "56.25%",
                bgcolor: "action.hover",
                overflow: "hidden",
                borderRadius: "10px 10px 0 0",
              }}
            >
              {course.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.disabled",
                  }}
                >
                  <Typography variant="body2">No Image</Typography>
                </Box>
              )}
            </Box>
            <Divider />
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {enrollment ? (
                firstLessonId ? (
                  <Button
                    href={`/courses/${courseId}/lessons/${firstLessonId}`}
                    variant="contained"
                    fullWidth
                  >
                    Continue to Course
                  </Button>
                ) : (
                  <Button variant="contained" fullWidth disabled>
                    No lessons available
                  </Button>
                )
              ) : (
                <EnrollButton courseId={courseId} />
              )}
              <Typography variant="caption" color="text.secondary" textAlign="center">
                {enrollment
                  ? "You are enrolled in this course"
                  : "Full access to all lessons"}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </PageContainer>
  );
}

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <Suspense fallback={<CourseDetailsSkeleton />}>
      <CourseContent courseId={courseId} />
    </Suspense>
  );
}

function CourseDetailsSkeleton() {
  return (
    <PageContainer maxWidth="md">
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton width="75%" height={40} sx={{ mb: 1.5 }} />
          <Skeleton width="50%" height={22} sx={{ mb: 3 }} />
          <Box sx={{ mb: 4 }}>
            <Skeleton height={18} sx={{ mb: 1 }} />
            <Skeleton height={18} sx={{ mb: 1 }} />
            <Skeleton width="66%" height={18} />
          </Box>
          <Skeleton width={200} height={32} sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={56} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        </Box>
        <Box sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0 }}>
          <Card>
            <Skeleton variant="rectangular" sx={{ paddingTop: "56.25%" }} />
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Skeleton height={42} sx={{ borderRadius: 2 }} />
              <Skeleton width="66%" height={18} sx={{ mx: "auto" }} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </PageContainer>
  );
}
