"use client";

import { useState, useOptimistic, useTransition } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import { toggleCoursePublished } from "@/features/admin/actions/admin-actions";

type Course = {
  id: string;
  title: string;
  category: string | null;
  isPublished: boolean;
  createdAt: Date;
  teacher: { id: string; name: string | null; email: string };
  _count: { enrollments: number; lessons: number };
};

interface Props {
  courses: Course[];
}

export function CourseOversightTable({ courses: initialCourses }: Props) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [optimisticCourses, updateOptimistic] = useOptimistic(
    initialCourses,
    (state, { id, isPublished }: { id: string; isPublished: boolean }) =>
      state.map((c) => (c.id === id ? { ...c, isPublished } : c)),
  );

  const handleToggle = (courseId: string, newValue: boolean) => {
    startTransition(async () => {
      updateOptimistic({ id: courseId, isPublished: newValue });
      try {
        await toggleCoursePublished(courseId, newValue);
      } catch {
        toast.error("Failed to update course status");
      }
    });
  };

  const filtered = optimisticCourses.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.teacher.name ?? c.teacher.email)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by title or teacher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
      </Box>

      {filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No courses found.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Students</TableCell>
              <TableCell align="right">Lessons</TableCell>
              <TableCell align="center">Published</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {c.title}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                  {c.teacher.name ?? c.teacher.email}
                </TableCell>
                <TableCell>
                  {c.category ? (
                    <Chip label={c.category} size="small" variant="outlined" />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell align="right">{c._count.enrollments}</TableCell>
                <TableCell align="right">{c._count.lessons}</TableCell>
                <TableCell align="center">
                  <Switch
                    size="small"
                    checked={c.isPublished}
                    onChange={(e) => handleToggle(c.id, e.target.checked)}
                    disabled={isPending}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
