import { Suspense } from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function CourseList() {
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
    },
    include: {
      teacher: true,
      _count: {
        select: { lessons: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (courses.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No courses available at the moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Link key={course.id} href={`/courses/${course.id}`}>
          <Card className="h-full hover:shadow-lg transition flex flex-col overflow-hidden">
            <div className="aspect-video relative bg-slate-100 overflow-hidden">
              {course.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
            <CardHeader className="flex-none">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{course.category || "Uncategorized"}</Badge>
                <span className="text-xs text-muted-foreground">{course._count.lessons} Lessons</span>
              </div>
              <CardTitle className="line-clamp-2">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="mt-auto">
              <CardDescription className="text-sm">
                By {course.teacher?.name || "Unknown Teacher"}
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Course Catalog</h1>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <div className="aspect-video bg-slate-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <CourseList />
      </Suspense>
    </div>
  );
}
