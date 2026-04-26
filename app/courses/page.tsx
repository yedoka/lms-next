import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cacheTag } from "next/cache";

export default async function CoursesPage() {
  "use cache";
  cacheTag("courses");

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

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Course Catalog</h1>
      
      {courses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No courses available at the moment.
        </div>
      ) : (
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
      )}
    </div>
  );
}
