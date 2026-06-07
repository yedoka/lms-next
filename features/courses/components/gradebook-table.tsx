"use client";

import { useState } from "react";
import { GradebookEntry } from "../services/gradebook-service";
import { ScoreOverrideDialog } from "./score-override-dialog";
import { Edit2, AlertCircle } from "lucide-react";
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

interface GradebookTableProps {
  courseId: string;
  gradebook: GradebookEntry[];
  quizzes: { id: string; title: string }[];
}

export function GradebookTable({
  courseId,
  gradebook,
  quizzes,
}: GradebookTableProps) {
  const [overrideData, setOverrideData] = useState<{
    attemptId: string | null;
    studentName: string;
    quizTitle: string;
    currentScore: number | null;
  } | null>(null);

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
            {quizzes.map((quiz) => (
              <TableCell key={quiz.id} align="center" sx={{ fontWeight: 600 }}>
                {quiz.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {gradebook.length === 0 ? (
            <TableRow>
              <TableCell colSpan={quizzes.length + 1} align="center" sx={{ py: 6, color: "text.secondary" }}>
                No students enrolled or no quiz attempts yet.
              </TableCell>
            </TableRow>
          ) : (
            gradebook.map((entry) => (
              <TableRow key={entry.student.id}>
                <TableCell>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="body2" fontWeight={600}>
                      {entry.student.name || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.student.email}
                    </Typography>
                  </Box>
                </TableCell>
                {entry.quizzes.map((quiz) => (
                  <TableCell key={quiz.quizId} align="center">
                    {quiz.bestScore !== null ? (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          position: "relative",
                          "&:hover .override-btn": { opacity: 1 },
                        }}
                      >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <Typography variant="body2" fontWeight={600}>
                            {quiz.bestScore}%
                          </Typography>
                          {quiz.passed ? (
                            <Chip
                              label="Passed"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: 10,
                                fontWeight: 600,
                                bgcolor: "rgba(68,131,97,0.1)",
                                color: "success.main",
                                border: "none",
                                px: 0.5,
                                "& .MuiChip-label": { px: 0.5 },
                              }}
                            />
                          ) : (
                            <Chip
                              label="Failed"
                              size="small"
                              color="error"
                              sx={{
                                height: 18,
                                fontSize: 10,
                                fontWeight: 600,
                                px: 0.5,
                                "& .MuiChip-label": { px: 0.5 },
                              }}
                            />
                          )}
                        </Box>

                        {quiz.isOverridden && (
                          <AlertCircle size={14} style={{ color: "var(--mui-palette-warning-main)" }} />
                        )}

                        <IconButton
                          size="small"
                          className="override-btn"
                          sx={{
                            opacity: 0,
                            transition: "opacity 0.15s",
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: "action.hover",
                          }}
                          aria-label={`Override score for ${entry.student.name || entry.student.email} on ${quiz.quizTitle}`}
                          onClick={() =>
                            setOverrideData({
                              attemptId: quiz.bestAttemptId,
                              studentName: entry.student.name || entry.student.email,
                              quizTitle: quiz.quizTitle,
                              currentScore: quiz.bestScore,
                            })
                          }
                        >
                          <Edit2 size={12} />
                        </IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {overrideData && (
        <ScoreOverrideDialog
          courseId={courseId}
          attemptId={overrideData.attemptId}
          studentName={overrideData.studentName}
          quizTitle={overrideData.quizTitle}
          currentScore={overrideData.currentScore}
          isOpen={!!overrideData}
          onClose={() => setOverrideData(null)}
          onSuccess={() => {
            // refresh happens via revalidatePath in action
          }}
        />
      )}
    </TableContainer>
  );
}

