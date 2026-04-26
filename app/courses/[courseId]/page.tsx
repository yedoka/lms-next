import { Suspense } from "react";
import prisma from "@/shared/db/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { sanitizeHtml } from "@/shared/lib/sanitize";

async function CourseContent({ courseId }: { courseId: string }) {
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

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          <div className="mb-6 text-muted-foreground text-sm">
            Created by {course.teacher?.name || "Unknown"} • {course.category || "Uncategorized"}
          </div>
          
          <div 
            className="prose max-w-none mb-8" 
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description || "No description provided.") }} 
          />
          
          <h2 className="text-2xl font-bold mb-4">Course Content</h2>
          <div className="space-y-2">
            {course.lessons.length === 0 ? (
              <p className="text-muted-foreground">No lessons available yet.</p>
            ) : (
              course.lessons.map((lesson) => (
                <div key={lesson.id} className="p-4 border rounded-md flex items-center justify-between">
                  <span className="font-medium">{lesson.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <div className="bg-slate-50 p-6 rounded-lg border sticky top-10">
            {course.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full rounded-md mb-6 object-cover aspect-video"
              />
            ) : (
              <div className="w-full aspect-video rounded-md bg-slate-200 mb-6 flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            
            <Button className="w-full mb-2">Enroll Now</Button>
            <p className="text-xs text-center text-muted-foreground">
              Enrollment feature coming soon (LMS-008)
            </p>
          </div>
        </div>
      </div>
    </div>
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
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <div className="h-9 w-3/4 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-5 w-1/2 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="space-y-3 mb-8">
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="w-full md:w-1/3">
          <div className="bg-slate-50 p-6 rounded-lg border">
            <div className="w-full aspect-video bg-slate-200 rounded-md mb-6 animate-pulse" />
            <div className="h-10 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-3/4 mx-auto bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
