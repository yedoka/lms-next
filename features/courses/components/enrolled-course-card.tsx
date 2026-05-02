import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/features/auth/utils/routes";
import { Badge } from "@/shared/ui/badge";
import { CheckCircle2, PlayCircle } from "lucide-react";

export interface EnrolledCourseCardProps {
  courseId: string;
  title: string;
  thumbnail: string | null;
  category: string | null;
  teacherName: string;
  totalLessons: number;
  completedCount: number;
  progressPercentage: number;
  nextLessonId: string | null;
  bestQuizScore: number | null;
}

export function EnrolledCourseCard({
  courseId,
  title,
  thumbnail,
  category,
  teacherName,
  totalLessons,
  completedCount,
  progressPercentage,
  nextLessonId,
  bestQuizScore,
}: EnrolledCourseCardProps) {
  const isCompleted = progressPercentage === 100;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
        {bestQuizScore !== null && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm border-none shadow-sm">
              <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
              Quiz: {bestQuizScore}%
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="flex-1 space-y-2 p-4">
        <div className="flex items-center justify-between">
          {category && (
            <Badge variant="secondary" className="font-normal">
              {category}
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          )}
        </div>
        <h3 className="font-semibold line-clamp-2">{title}</h3>
        <p className="text-xs text-muted-foreground">{teacherName}</p>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-0">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {completedCount} of {totalLessons} lessons
            </span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isCompleted ? (
          <Button asChild className="w-full" variant="outline">
            <Link href={ROUTES.COURSE_DETAILS(courseId)}>
              Review Course
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link
              href={
                nextLessonId
                  ? ROUTES.COURSE_LESSON(courseId, nextLessonId)
                  : ROUTES.COURSE_DETAILS(courseId)
              }
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              {completedCount === 0 ? "Start Learning" : "Continue Learning"}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
