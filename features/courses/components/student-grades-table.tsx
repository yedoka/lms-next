"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ROUTES } from "@/features/auth/utils/routes";
import type {
  StudentCourseGrades,
  StudentQuizGrade,
} from "../services/student-grades-service";

interface StudentGradesTableProps {
  courses: StudentCourseGrades[];
}

export function StudentGradesTable({ courses }: StudentGradesTableProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {courses.map((course, index) => (
        <Accordion
          key={course.courseId}
          defaultExpanded={index === 0}
          disableGutters
          variant="outlined"
          sx={{ borderRadius: 2, "&:before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                pr: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                {course.courseTitle}
              </Typography>
              <Chip
                size="small"
                label={`${course.passedCount}/${course.totalQuizzes} passed`}
                color={
                  course.totalQuizzes > 0 &&
                  course.passedCount === course.totalQuizzes
                    ? "success"
                    : "default"
                }
              />
              <Chip
                size="small"
                variant="outlined"
                label={
                  course.averageScore !== null
                    ? `Avg ${course.averageScore}%`
                    : "Not attempted"
                }
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <CourseQuizTable courseId={course.courseId} quizzes={course.quizzes} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

function CourseQuizTable({
  courseId,
  quizzes,
}: {
  courseId: string;
  quizzes: StudentQuizGrade[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (quizzes.length === 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ px: 2, py: 4, textAlign: "center" }}
      >
        This course has no published quizzes yet.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ border: 0 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 48 }} />
            <TableCell sx={{ fontWeight: 600 }}>Quiz</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Lesson</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>
              Best score
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>
              Passing
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>
              Attempts
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Status
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quizzes.map((quiz) => {
            const isOpen = expanded === quiz.quizId;
            const hasOverride = quiz.attempts.some(
              (attempt) => attempt.override !== null,
            );

            return (
              <Fragment key={quiz.quizId}>
                <TableRow hover>
                  <TableCell>
                    {quiz.attempts.length > 0 && (
                      <IconButton
                        size="small"
                        aria-label={
                          isOpen
                            ? `Hide attempts for ${quiz.quizTitle}`
                            : `Show attempts for ${quiz.quizTitle}`
                        }
                        onClick={() => setExpanded(isOpen ? null : quiz.quizId)}
                      >
                        {isOpen ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {quiz.quizTitle}
                      </Typography>
                      {hasOverride && (
                        <Tooltip title="A teacher adjusted your score — open the attempts for the reason.">
                          <AlertCircle
                            size={14}
                            style={{ color: "var(--mui-palette-warning-main)" }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={ROUTES.COURSE_LESSON(courseId, quiz.lessonId)}
                      style={{ color: "inherit" }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {quiz.lessonTitle}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell align="center">
                    {quiz.bestScore !== null ? (
                      <Typography variant="body2" fontWeight={600}>
                        {quiz.bestScore}%
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {quiz.passingScore}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {quiz.attempts.length}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {quiz.passed === null ? (
                      <Button
                        size="small"
                        variant="outlined"
                        href={`${ROUTES.COURSE_LESSON(courseId, quiz.lessonId)}/quiz`}
                      >
                        Take quiz
                      </Button>
                    ) : quiz.passed ? (
                      <Chip size="small" color="success" label="Passed" />
                    ) : (
                      <Chip size="small" color="error" label="Failed" />
                    )}
                  </TableCell>
                </TableRow>

                {isOpen && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ bgcolor: "action.hover", py: 2 }}>
                      <AttemptHistory courseId={courseId} quiz={quiz} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function AttemptHistory({
  courseId,
  quiz,
}: {
  courseId: string;
  quiz: StudentQuizGrade;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, px: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        Attempt history
      </Typography>

      {quiz.attempts.map((attempt, index) => (
        <Box
          key={attempt.attemptId}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ minWidth: 88 }}>
            Attempt {quiz.attempts.length - index}
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 48 }}>
            {attempt.score}%
          </Typography>
          {attempt.isBest && <Chip size="small" label="Best" />}
          <Typography variant="caption" color="text.secondary">
            {attempt.submittedAt
              ? new Date(attempt.submittedAt).toLocaleString()
              : "Not submitted"}
          </Typography>
          <Button
            size="small"
            href={`${ROUTES.COURSE_LESSON(courseId, quiz.lessonId)}/quiz/results/${attempt.attemptId}`}
          >
            Review
          </Button>

          {attempt.override && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexBasis: "100%",
                pl: 1,
                borderLeft: 2,
                borderColor: "warning.main",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Regraded {attempt.originalScore}% → {attempt.score}%
                {attempt.override.teacherName
                  ? ` by ${attempt.override.teacherName}`
                  : ""}
                {attempt.override.reason
                  ? ` — ${attempt.override.reason}`
                  : " — no reason given"}
              </Typography>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
