import { auth } from "@/auth";
import prisma from "@/shared/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight, PlayCircle, CheckCircle } from "lucide-react";
import { sanitizeHtml } from "@/shared/lib/sanitize";
import { cn } from "@/shared/lib/utils";
import { VideoPlayer } from "@/features/courses/components/video-player";

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
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {lesson.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-sky-100 border-sky-200 border text-sky-700 rounded-md hover:underline"
                    >
                      <p className="line-clamp-1">{attachment.name}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}