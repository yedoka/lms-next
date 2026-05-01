import { auth } from "@/auth";
import prisma from "@/shared/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight, PlayCircle, CheckCircle, FileText, Archive, File } from "lucide-react";
import { sanitizeHtml } from "@/shared/lib/sanitize";
import { cn } from "@/shared/lib/utils";
import { VideoPlayer } from "@/features/courses/components/video-player";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
      return <FileText className="h-4 w-4 mr-2 flex-shrink-0" />;
    case 'zip':
    case 'rar':
    case '7z':
      return <Archive className="h-4 w-4 mr-2 flex-shrink-0" />;
    default:
      return <File className="h-4 w-4 mr-2 flex-shrink-0" />;
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  // Also allow teacher of the course or admin
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });

  const isTeacher = course?.teacherId === userId;
  const isAdmin = session.user.role === "ADMIN";

  if (!enrollment && !isTeacher && !isAdmin) {
    redirect(`/courses/${courseId}`);
  }

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
            take: 1
          }
        }
      }
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

  // Check progress for all lessons in this course to show completion state in sidebar
  const userProgress = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: {
        in: lessons.map((l) => l.id),
      },
      isCompleted: true,
    },
  });

  const completedLessonIds = new Set(userProgress.map((p) => p.lessonId));

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row h-full">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r bg-slate-50 flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 border-b bg-white">
            <h2 className="font-semibold truncate">Course Content</h2>
          </div>
          <div className="flex flex-col w-full">
            {lessons.map((l) => {
              const isLessonCompleted = completedLessonIds.has(l.id);
              return (
                <Link
                  key={l.id}
                  href={`/courses/${courseId}/lessons/${l.id}`}
                  className={cn(
                    "flex items-center gap-x-2 text-slate-500 text-sm font-[500] pl-6 transition-all hover:text-slate-600 hover:bg-slate-300/20",
                    l.id === lessonId && "text-sky-700 bg-sky-200/20 hover:bg-sky-200/20 hover:text-sky-700",
                    isLessonCompleted && "text-emerald-700 hover:text-emerald-700"
                  )}
                >
                  <div className="flex items-center gap-x-2 py-4">
                    {isLessonCompleted ? (
                      <CheckCircle size={22} className="text-emerald-500" />
                    ) : (
                      <PlayCircle size={22} className={cn("text-slate-500", l.id === lessonId && "text-sky-700")} />
                    )}
                    {l.title}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="max-w-4xl mx-auto p-6">
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-8 relative">
              {lesson.videoUrl ? (
                <VideoPlayer url={lesson.videoUrl} lessonId={lessonId} isCompleted={isCompleted} />
              ) : (
                <div className="flex items-center justify-center h-full text-white bg-slate-800">
                  No video available for this lesson.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{lesson.title}</h1>
              <div className="flex gap-2">
                {prevLesson && (
                  <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`}>
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Prev
                    </Button>
                  </Link>
                )}
                {nextLesson && (
                  <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                    <Button variant="outline" size="sm">
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div 
              className="prose max-w-none mb-8" 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.description || "") }}
            />

            {lesson.attachments.length > 0 && (
              <div className="p-4 border rounded-md bg-slate-50">
                <h3 className="font-semibold mb-3">Course Materials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lesson.attachments.map((attachment) => {
                    // Cloudinary requires fl_attachment flag to deliver raw files like PDFs/ZIPs securely
                    const downloadUrl = attachment.url.replace('/upload/', '/upload/fl_attachment/');
                    return (
                      <a
                        key={attachment.id}
                        href={downloadUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col p-3 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors group"
                      >
                        <div className="flex items-center text-slate-700 group-hover:text-sky-700 transition-colors">
                          {getFileIcon(attachment.name)}
                          <p className="line-clamp-1 font-medium text-sm">{attachment.name}</p>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 pl-6">
                          {formatBytes(attachment.size)}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {lesson.quizzes && lesson.quizzes.length > 0 && (
              <div className="p-4 border rounded-md bg-slate-50 mt-8">
                <h3 className="font-semibold mb-3">Lesson Quiz</h3>
                {lesson.quizzes.map((quiz) => {
                  const bestAttempt = quiz.attempts[0];
                  return (
                    <div key={quiz.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-md">
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        {bestAttempt && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Best score: <span className={cn("font-medium", bestAttempt.passed ? "text-green-600" : "text-destructive")}>{bestAttempt.score}%</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {bestAttempt && (
                          <Button asChild variant="outline">
                            <Link href={`/courses/${courseId}/lessons/${lessonId}/quiz/results/${bestAttempt.id}`}>
                              View Results
                            </Link>
                          </Button>
                        )}
                        <Button asChild>
                          <Link href={`/courses/${courseId}/lessons/${lessonId}/quiz`}>
                            {bestAttempt ? "Retake Quiz" : "Take Quiz"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}