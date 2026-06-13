"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { startLiveSessionAction } from "../actions/live-session-actions";
import {
  useLiveSession,
  type LeaderboardEntry,
  type QuestionData,
} from "../hooks/use-live-session";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Users, Trophy, CheckCircle2, Play, SkipForward, StopCircle } from "lucide-react";

interface LiveQuizHostProps {
  courseId: string;
  lessonId: string;
  quizId: string;
  quizTitle: string;
}

function LeaderboardPanel({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Stack spacing={1}>
      {entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No answers yet
        </Typography>
      ) : (
        entries.map((entry, i) => (
          <Box
            key={entry.userId}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: i === 0 ? "warning.light" : i === 1 ? "grey.100" : "background.paper",
              border: "1px solid",
              borderColor: i === 0 ? "warning.main" : "divider",
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ minWidth: 24, textAlign: "center", color: i === 0 ? "warning.dark" : "text.secondary" }}
            >
              {i + 1}
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
              {entry.name}
            </Typography>
            <Chip
              label={entry.score.toLocaleString()}
              size="small"
              color={i === 0 ? "warning" : "default"}
              sx={{ fontWeight: 700, minWidth: 60 }}
            />
          </Box>
        ))
      )}
    </Stack>
  );
}

function QuestionPanel({
  question,
  answeredCount,
  totalPlayers,
}: {
  question: QuestionData;
  answeredCount: number;
  totalPlayers: number;
}) {
  const progress = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Question {question.index + 1} / {question.total}
        </Typography>
        <Typography variant="h6" fontWeight={600} mt={0.5}>
          {question.text}
        </Typography>
      </Box>

      <Stack spacing={1}>
        {question.answers.map((a) => (
          <Box
            key={a.id}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: a.isCorrect ? "success.main" : "divider",
              bgcolor: a.isCorrect ? "success.light" : "background.paper",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {a.isCorrect && <CheckCircle2 size={16} color="green" />}
            <Typography variant="body2" fontWeight={a.isCorrect ? 700 : 400}>
              {a.text}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Box>
        <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
          {answeredCount} / {totalPlayers} answered
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
          color="success"
        />
      </Box>
    </Stack>
  );
}

export function LiveQuizHost({
  courseId,
  lessonId,
  quizId,
  quizTitle,
}: LiveQuizHostProps) {
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(20);
  const [isPending, startTransition] = useTransition();
  const [isStarting, setIsStarting] = useState(false);
  const { state, joinSession, startSession, nextQuestion, endSession } =
    useLiveSession();

  const handleCreateSession = useCallback(() => {
    setIsStarting(true);
    startTransition(async () => {
      try {
        const { code } = await startLiveSessionAction(
          courseId,
          lessonId,
          quizId,
          secondsPerQuestion,
        );
        joinSession(code);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start session");
        setIsStarting(false);
      }
    });
  }, [courseId, lessonId, quizId, secondsPerQuestion, joinSession]);

  // Auto-create the session on mount
  useEffect(() => {
    handleCreateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPlayers = state.leaderboard.length;
  const isLastQuestion =
    state.currentQuestion !== null &&
    state.currentQuestion.index === state.currentQuestion.total - 1;

  if (isStarting && state.status === "idle") {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Creating live session…</Typography>
      </Box>
    );
  }

  if (state.status === "error") {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", py: 6, textAlign: "center" }}>
        <Typography variant="h6" color="error" gutterBottom>
          {state.error ?? "Something went wrong"}
        </Typography>
        <Button variant="contained" onClick={handleCreateSession} disabled={isPending}>
          Try again
        </Button>
      </Box>
    );
  }

  if (state.status === "ended") {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", py: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Trophy size={48} color="#f59e0b" />
          <Typography variant="h4" fontWeight={700} mt={2}>
            Session Complete
          </Typography>
          <Typography color="text.secondary">{quizTitle}</Typography>
        </Box>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Final Leaderboard
            </Typography>
            <LeaderboardPanel entries={state.leaderboard} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {quizTitle}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Users size={14} />
            <Typography variant="caption" color="text.secondary">
              {totalPlayers} participant{totalPlayers !== 1 ? "s" : ""}
            </Typography>
            <Chip
              label={state.status === "lobby" ? "Waiting" : "Live"}
              size="small"
              color={state.status === "active" ? "error" : "default"}
              sx={{ ml: 1, fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Session code */}
        {state.code && (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Session code
            </Typography>
            <Typography
              variant="h3"
              fontWeight={900}
              letterSpacing={4}
              color="primary"
              sx={{ fontFamily: "monospace" }}
            >
              {state.code}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Students join at /live
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 320px" },
          gap: 3,
        }}
      >
        {/* Main panel */}
        <Stack spacing={3}>
          {state.status === "lobby" && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Lobby
                </Typography>
                {totalPlayers === 0 ? (
                  <Typography color="text.secondary" py={3} textAlign="center">
                    Waiting for students to join…
                  </Typography>
                ) : (
                  <Stack spacing={1} mb={2}>
                    {state.leaderboard.map((p) => (
                      <Box
                        key={p.userId}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: "action.hover",
                        }}
                      >
                        <Users size={14} />
                        <Typography variant="body2">{p.name}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Seconds per question</InputLabel>
                    <Select
                      value={secondsPerQuestion}
                      label="Seconds per question"
                      onChange={(e) =>
                        setSecondsPerQuestion(Number(e.target.value))
                      }
                    >
                      {[10, 15, 20, 30, 45, 60].map((v) => (
                        <MenuItem key={v} value={v}>
                          {v}s
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Play size={16} />}
                    onClick={startSession}
                    disabled={totalPlayers === 0}
                  >
                    Start Quiz
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {state.status === "active" && state.currentQuestion && (
            <Card variant="outlined">
              <CardContent>
                <QuestionPanel
                  question={state.currentQuestion}
                  answeredCount={state.answeredCount}
                  totalPlayers={totalPlayers}
                />
              </CardContent>
            </Card>
          )}

          {state.status === "active" && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<SkipForward size={16} />}
                onClick={nextQuestion}
              >
                {isLastQuestion ? "Finish Quiz" : "Next Question"}
              </Button>
              {!isLastQuestion && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopCircle size={16} />}
                  onClick={endSession}
                >
                  End Early
                </Button>
              )}
            </Stack>
          )}
        </Stack>

        {/* Leaderboard sidebar */}
        <Box>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Trophy size={16} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Leaderboard
                </Typography>
              </Box>
              <LeaderboardPanel entries={state.leaderboard} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
