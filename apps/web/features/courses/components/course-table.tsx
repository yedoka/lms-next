import { Pencil, GraduationCap } from "lucide-react";
import { DeleteCourseButton } from "@/features/courses/components/delete-course-button";
import { Course } from "@prisma/client";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";

interface CourseTableProps {
  courses: Course[];
}

/**
 * Table for displaying the teacher's courses list.
 * Includes publication status and actions (gradebook / edit / delete).
 */
export function CourseTable({ courses }: CourseTableProps) {
  if (courses.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 6,
          bgcolor: "action.hover",
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          m: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No courses found. Create one to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ border: "none", borderRadius: 0 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell sx={{ fontWeight: 500 }}>{course.title}</TableCell>
              <TableCell>{course.category || "Uncategorized"}</TableCell>
              <TableCell>
                <Chip
                  label={course.isPublished ? "Published" : "Draft"}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    ...(course.isPublished
                      ? { bgcolor: "rgba(68,131,97,0.1)", color: "success.main" }
                      : { bgcolor: "secondary.main", color: "text.primary" }),
                    border: "none",
                    height: 20,
                  }}
                />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                  <IconButton
                    href={`/dashboard/teacher/courses/${course.id}/gradebook`}
                    title="View Gradebook"
                    size="small"
                  >
                    <GraduationCap size={16} />
                  </IconButton>
                  <IconButton
                    href={`/dashboard/teacher/courses/${course.id}/edit`}
                    title="Edit Course"
                    size="small"
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <DeleteCourseButton
                    courseId={course.id}
                    courseTitle={course.title}
                  />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

