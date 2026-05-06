import prisma from "@/shared/db/prisma";
import Link from "next/link";
import { PlayCircle, CheckCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function SidebarSkeleton() {
  return (
    <div className="w-full md:w-80 border-r bg-slate-50 flex flex-col h-[calc(100vh-64px)]">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold truncate">Course Content</h2>
      </div>
      <div className="flex flex-col w-full space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export async function CourseSidebar({
  courseId,
  lessonId,
  userId,
}: {
  courseId: string;
  lessonId: string;
  userId: string;
}) {
  const lessons = await prisma.lesson.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    orderBy: {
      position: "asc",
    },
  });

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
  );
}
