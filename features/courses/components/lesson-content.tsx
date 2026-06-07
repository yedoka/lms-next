import prisma from "@/shared/db/prisma";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText, Archive, File } from "lucide-react";
import { sanitizeHtml } from "@/shared/lib/sanitize";
import { VideoPlayer } from "@/features/courses/components/video-player";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { PageContainer, SectionCard } from "@/shared/components/ui";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const iconProps = { size: 16, style: { marginRight: 8, flexShrink: 0 } };
  switch (ext) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
      return <FileText {...iconProps} />;
    case "zip":
    case "rar":
    case "7z":
      return <Archive {...iconProps} />;
    default:
      return <File {...iconProps} />;
  }
}

export function ContentSkeleton() {
  return (
    <Box component="main" sx={{ flex: 1, overflowY: "auto", height: { md: "calc(100vh - 64px)" } }}>
      <PageContainer maxWidth="md" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ width: "100%", pt: "56.25%", position: "relative" }}>
            <Skeleton variant="rectangular" sx={{ position: "absolute", inset: 0, borderRadius: 3, height: "100%" }} />
          </Box>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
        </Stack>
      </PageContainer>
    </Box>
  );
}

export async function LessonContent({
  courseId,
  lessonId,
  userId,
}: {
  courseId: string;
  lessonId: string;
  userId: string;
}) {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      courseId,
      isPublished: true,
    },
    include: {
      attachments: true,
      quizzes: {
        where: { isPublished: true },
        include: {
          attempts: {
            where: { userId },
            orderBy: { score: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    orderBy: {
      position: "asc",
    },
  });

  const currentLessonIndex = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = lessons[currentLessonIndex - 1];
  const nextLesson = lessons[currentLessonIndex + 1];

  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
  });

  const isCompleted = !!progress?.isCompleted;

  return (
    <Box component="main" sx={{ flex: 1, overflowY: "auto", height: { md: "calc(100vh - 64px)" } }}>
      <PageContainer maxWidth="md" sx={{ py: 3 }}>
        {/* Video Player Box */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            pt: "56.25%",
            bgcolor: "black",
            borderRadius: 3,
            overflow: "hidden",
            mb: 4,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            {lesson.videoUrl ? (
              <VideoPlayer url={lesson.videoUrl} lessonId={lessonId} isCompleted={isCompleted} />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "white",
                  bgcolor: "grey.900",
                }}
              >
                <Typography variant="body1">No video available for this lesson.</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Title and Navigation */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2 }}>
          <Typography variant="h5" component="h1" fontWeight={700}>
            {lesson.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            {prevLesson && (
              <Button
                href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                variant="outlined"
                size="small"
                startIcon={<ChevronLeft size={16} />}
              >
                Prev
              </Button>
            )}
            {nextLesson && (
              <Button
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                variant="outlined"
                size="small"
                endIcon={<ChevronRight size={16} />}
              >
                Next
              </Button>
            )}
          </Stack>
        </Box>

        {/* Lesson Description */}
        <Box
          className="tiptap-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.description || "") }}
          sx={{ mb: 4 }}
        />

        {/* Attachments Section */}
        {lesson.attachments.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <SectionCard title="Course Materials">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 2,
                }}
              >
                {lesson.attachments.map((attachment) => {
                  const downloadUrl = attachment.url.replace("/upload/", "/upload/fl_attachment/");
                  return (
                    <Box
                      key={attachment.id}
                      component="a"
                      href={downloadUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        p: 2,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        textDecoration: "none",
                        color: "text.primary",
                        transition: "background-color 0.15s, border-color 0.15s",
                        "&:hover": {
                          bgcolor: "action.hover",
                          borderColor: "text.disabled",
                          "& .attachment-title": { color: "info.main" },
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        {getFileIcon(attachment.name)}
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          className="attachment-title"
                          noWrap
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            transition: "color 0.15s",
                          }}
                        >
                          {attachment.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 3 }}>
                        {formatBytes(attachment.size)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </SectionCard>
          </Box>
        )}

        {/* Quizzes Section */}
        {lesson.quizzes && lesson.quizzes.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <SectionCard title="Lesson Quiz">
              <Stack spacing={2}>
                {lesson.quizzes.map((quiz) => {
                  const bestAttempt = quiz.attempts[0];
                  return (
                    <Box
                      key={quiz.id}
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                        p: 2,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {quiz.title}
                        </Typography>
                        {bestAttempt && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                            Best score:{" "}
                            <Typography
                              component="span"
                              variant="caption"
                              fontWeight={600}
                              sx={{
                                color: bestAttempt.passed ? "success.main" : "error.main",
                              }}
                            >
                              {bestAttempt.score}%
                            </Typography>
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                        {bestAttempt && (
                          <Button
                            href={`/courses/${courseId}/lessons/${lessonId}/quiz/results/${bestAttempt.id}`}
                            variant="outlined"
                            size="small"
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            View Results
                          </Button>
                        )}
                        <Button
                          href={`/courses/${courseId}/lessons/${lessonId}/quiz`}
                          variant="contained"
                          size="small"
                          sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                          {bestAttempt ? "Retake Quiz" : "Take Quiz"}
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </SectionCard>
          </Box>
        )}
      </PageContainer>
    </Box>
  );
}

