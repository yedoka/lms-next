import { auth } from "@/auth";
import { ROLE } from "@/features/auth/utils/roles";
import {
  getUsersForExport,
  getEnrollmentsForExport,
} from "@/features/admin/services/admin-service";
import { NextResponse } from "next/server";

function escapeCSV(val: string | number | null): string {
  if (val === null) return "";
  const str = val.toString();
  // Prevent CSV injection by sanitizing leading characters like =, +, -, @
  const sanitized = str.replace(/^[=+\-@]/, "'$&");
  return `"${sanitized.replace(/"/g, '""')}"`;
}

function toCSV(headers: string[], rows: (string | number | null)[][]): string {
  return [
    headers.map(escapeCSV).join(","),
    ...rows.map((r) => r.map(escapeCSV).join(",")),
  ].join("\n");
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (session.user.role !== ROLE.ADMIN) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const type = new URL(request.url).searchParams.get("type") ?? "users";

  try {
    let csv: string;
    let filename: string;

    if (type === "enrollments") {
      const enrollments = await getEnrollmentsForExport();
      csv = toCSV(
        ["Student", "Student Email", "Course", "Teacher", "Enrolled At"],
        enrollments.map((e) => [
          e.user.name ?? "N/A",
          e.user.email,
          e.course.title,
          e.course.teacher.name ?? e.course.teacher.email,
          e.createdAt.toISOString(),
        ]),
      );
      filename = "enrollments.csv";
    } else if (type === "users") {
      const users = await getUsersForExport();
      csv = toCSV(
        ["Name", "Email", "Role", "Enrollments", "Quiz Attempts", "Joined"],
        users.map((u) => [
          u.name ?? "N/A",
          u.email,
          u.role,
          u._count.enrollments,
          u._count.attempts,
          u.createdAt.toISOString(),
        ]),
      );
      filename = "users.csv";
    } else {
      return new NextResponse("Invalid export type", { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(message, { status: 500 });
  }
}
