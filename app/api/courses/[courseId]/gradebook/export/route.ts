import { auth } from "@/auth";
import { getCourseGradebook } from "@/features/courses/services/gradebook-service";
import { validateCourseOwnership } from "@/features/courses/utils/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Validate ownership
    await validateCourseOwnership(courseId, session.user.id, session.user.role);

    const { gradebook, quizzes } = await getCourseGradebook(courseId);

    // Create CSV content
    const headers = ["Student Name", "Email", ...quizzes.map((q) => q.title)];
    const rows = gradebook.map((entry) => {
      const studentData = [
        entry.student.name || "N/A",
        entry.student.email,
        ...entry.quizzes.map((q) =>
          q.bestScore !== null ? `${q.bestScore}%` : "-",
        ),
      ];
      return studentData.join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gradebook-${courseId}.csv"`,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(message, {
      status: message === "Unauthorized" ? 403 : 500,
    });
  }
}
