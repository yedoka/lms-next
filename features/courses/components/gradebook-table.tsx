"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { GradebookEntry } from "../services/gradebook-service";
import { ScoreOverrideDialog } from "./score-override-dialog";
import { Edit2, AlertCircle } from "lucide-react";

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
    <div className="rounded-md border border-border/40 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold">Student</TableHead>
            {quizzes.map((quiz) => (
              <TableHead key={quiz.id} className="text-center font-semibold">
                {quiz.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {gradebook.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={quizzes.length + 1}
                className="h-24 text-center text-muted-foreground"
              >
                No students enrolled or no quiz attempts yet.
              </TableCell>
            </TableRow>
          ) : (
            gradebook.map((entry) => (
              <TableRow key={entry.student.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {entry.student.name || "N/A"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.student.email}
                    </span>
                  </div>
                </TableCell>
                {entry.quizzes.map((quiz) => (
                  <TableCell key={quiz.quizId} className="text-center">
                    {quiz.bestScore !== null ? (
                      <div className="group relative flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-base">
                            {quiz.bestScore}%
                          </span>
                          {quiz.passed ? (
                            <Badge
                              variant="default"
                              className="bg-green-500/10 text-green-600 border-green-500/20 px-1 h-4 text-[10px]"
                            >
                              Passed
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="px-1 h-4 text-[10px]"
                            >
                              Failed
                            </Badge>
                          )}
                        </div>

                        {quiz.isOverridden && (
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                        )}

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Override score for ${entry.student.name || entry.student.email} on ${quiz.quizTitle}`}
                          onClick={() =>
                            setOverrideData({
                              attemptId: quiz.bestAttemptId,
                              studentName:
                                entry.student.name || entry.student.email,
                              quizTitle: quiz.quizTitle,
                              currentScore: quiz.bestScore,
                            })
                          }
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
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
    </div>
  );
}
