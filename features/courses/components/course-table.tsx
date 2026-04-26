import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { DeleteCourseButton } from "@/features/courses/components/delete-course-button";
import { Course } from "@prisma/client";

interface CourseTableProps {
  courses: Course[];
}

/**
 * Таблица для отображения списка курсов преподавателя.
 * Включает статус публикации и кнопки действий (редактирование/удаление).
 */
export function CourseTable({ courses }: CourseTableProps) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 border rounded-lg bg-muted/20">
        <p className="text-sm text-muted-foreground">
          No courses found. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id}>
            <TableCell className="font-medium">{course.title}</TableCell>
            <TableCell>{course.category || "Uncategorized"}</TableCell>
            <TableCell>
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Link href={`/dashboard/teacher/courses/${course.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </Link>
                <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
