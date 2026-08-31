"use client";

import { useState, useEffect } from "react";
import {
  useLiveSession,
  type LeaderboardEntry,
  type QuestionReview,
} from "../hooks/use-live-session";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { CheckCircle2, XCircle, Trophy, Clock, Lock, MinusCircle } from "lucide-react";

function CountdownBar({
  questionStartedAt,
  secondsPerQuestion,
}: {
  questionStartedAt: string;
  secondsPerQuestion: number;
}) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = (Date.now() - new Date(questionStartedAt).getTime()) / 1000;
    return Math.max(0, secondsPerQuestion - Math.floor(elapsed));
  });
  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - new Date(questionStartedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, secondsPerQuestion - Math.floor(elapsed)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [questionStartedAt, secondsPerQuestion]);

  const pct = (timeLeft / secondsPerQuestion) * 100;
  const isWarning = timeLeft <= 5;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Clock size={14} />
        <Typography
          variant="caption"
          fontWeight={700}
          color={isWarning ? "error" : "text.secondary"}
          sx={isWarning ? { animation: "pulse 0.8s infinite", "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } } : {}}
        >
          {timeLeft}s
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={isWarning ? "error" : "primary"}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

function FinalLeaderboard({ entries, myUserId }: { entries: LeaderboardEntry[]; myUserId?: string }) {
  return (
    <Stack spacing={1}>
      {entries.map((entry, i) => (
        <Box
          key={entry.userId}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: entry.userId === myUserId ? "primary.main" : i === 0 ? "warning.main" : "divider",
            bgcolor:
              entry.userId === myUserId
                ? "primary.light"
                : i === 0
                  ? "warning.light"
                  : "background.paper",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ minWidth: 24, textAlign: "center" }}>
            {i + 1}
          </Typography>
          <Typography variant="body2" fontWeight={entry.userId === myUserId ? 700 : 400} sx={{ flex: 1 }}>
            {entry.name} {entry.userId === myUserId && "(You)"}
          </Typography>
          <Chip label={entry.score.toLocaleString()} size="small" color={i === 0 ? "warning" : "default"} sx={{ fontWeight: 700 }} />
        </Box>
      ))}
    </Stack>
  );
}

function QuestionReviewList({ review }: { review: QuestionReview[] }) {
  return (
    <Stack spacing={2}>
      {review.map((item, i) => {
        const skipped = item.selectedAnswerId === null;
        return (
          <Box key={item.questionId}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {skipped ? (
                <MinusCircle size={16} color="#9ca3af" />
              ) : item.isCorrect ? (
                <CheckCircle2 size={16} color="green" />
              ) : (
                <XCircle size={16} color="red" />
              )}
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                {i + 1}. {item.text}
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color={item.points > 0 ? "primary" : "text.secondary"}
              >
                {item.points > 0 ? `+${item.points.toLocaleString()}` : skipped ? "No answer" : "0"}
              </Typography>
            </Box>
            <Stack spacing={0.5} sx={{ pl: 3 }}>
              {item.answers.map((answer) => {
                const chosen = answer.id === item.selectedAnswerId;
                return (
                  <Box
                    key={answer.id}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: answer.isCorrect
                        ? "success.main"
                        : chosen
                          ? "error.main"
                          : "divider",
                      bgcolor: answer.isCorrect
                        ? "success.light"
                        : chosen
                          ? "error.light"
                          : "transparent",
                    }}
                  >
                    <Typography variant="caption" fontWeight={chosen ? 700 : 400}>
                      {answer.text}
                      {chosen && " · your answer"}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

interface LiveQuizPlayerProps {
  initialCode?: string;
}

export function LiveQuizPlayer({ initialCode }: LiveQuizPlayerProps) {
  const [codeInput, setCodeInput] = useState(initialCode ?? "");
  const [joined, setJoined] = useState(false);
  const { state, joinSession, submitAnswer } = useLiveSession();

  const handleJoin = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 6) return;
    setJoined(true);
    joinSession(code);
  };

  // `session:final` carries the student's own userId, so "you" is matched by
  // identity rather than by score — two players on the same score used to
  // collide and both highlight the first of them.
  const myRankIndex = state.userId
    ? state.leaderboard.findIndex((e) => e.userId === state.userId)
    : -1;
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : undefined;

  if (!joined) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 400, p: 2 }} variant="outlined">
          <CardContent>
            <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
              Join Live Quiz
            </Typography>
            <Typography color="text.secondary" textAlign="center" mb={3}>
              Enter the 6-character session code from your teacher
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Session code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                inputProps={{ maxLength: 6, style: { textTransform: "uppercase", letterSpacing: 8, fontFamily: "monospace", fontSize: 24, textAlign: "center" } }}
                fullWidth
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleJoin}
                disabled={codeInput.trim().length !== 6}
              >
                Join Session
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (state.status === "error") {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error ?? "Failed to join session"}
        </Alert>
        <Button variant="outlined" onClick={() => setJoined(false)}>
          Try another code
        </Button>
      </Box>
    );
  }

  if (state.status === "idle" || (state.status === "lobby" && !state.title)) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Connecting…</Typography>
      </Box>
    );
  }

  if (state.status === "lobby") {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box textAlign="center">
          <Chip label="LIVE" color="error" sx={{ mb: 2, fontWeight: 700, px: 1 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {state.title}
          </Typography>
          <Typography color="text.secondary" mb={4}>
            Waiting for the teacher to start…
          </Typography>
          <CircularProgress size={32} />
        </Box>
      </Box>
    );
  }

  if (state.status === "ended") {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", py: 4 }}>
        <Box textAlign="center" mb={4}>
          <Trophy size={48} color="#f59e0b" />
          <Typography variant="h4" fontWeight={700} mt={2}>
            Quiz Complete!
          </Typography>
          <Typography color="text.secondary">{state.title}</Typography>
          <Box sx={{ mt: 2, display: "inline-flex", gap: 2 }}>
            <Chip label={`Your score: ${state.score.toLocaleString()}`} color="primary" sx={{ fontWeight: 700, fontSize: 16, px: 1 }} />
            {myRank && <Chip label={`Rank #${myRank}`} color={myRank === 1 ? "warning" : "default"} sx={{ fontWeight: 700, fontSize: 16, px: 1 }} />}
          </Box>
        </Box>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Final Results
            </Typography>
            <FinalLeaderboard entries={state.leaderboard} myUserId={state.userId ?? undefined} />
          </CardContent>
        </Card>
        {state.review.length > 0 && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Your Answers
              </Typography>
              <QuestionReviewList review={state.review} />
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  // active
  const question = state.currentQuestion;
  if (!question) return null;

  return (
    <Box sx={{ maxWidth: 680, mx: "auto", py: 3, px: 2 }}>
      {/* Progress + timer */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Question {question.index + 1} / {question.total}
          </Typography>
          <Typography variant="caption" fontWeight={600} color="primary">
            {state.score.toLocaleString()} pts
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={((question.index + 1) / question.total) * 100}
          sx={{ height: 4, borderRadius: 2, mb: 2 }}
        />
        {state.questionStartedAt && !state.reveal && (
          <CountdownBar
            questionStartedAt={state.questionStartedAt}
            secondsPerQuestion={state.secondsPerQuestion}
          />
        )}
      </Box>

      {/* Question card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} lineHeight={1.4}>
            {question.text}
          </Typography>
        </CardContent>
      </Card>

      {/* Verdict for the question just closed. It can say everything now: no
          answer is still being accepted, so there is nobody left to tip off. */}
      {state.reveal && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: state.reveal.isCorrect ? "success.light" : "error.light",
            border: "1px solid",
            borderColor: state.reveal.isCorrect ? "success.main" : "error.main",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {state.reveal.isCorrect ? (
            <CheckCircle2 size={20} color="green" />
          ) : (
            <XCircle size={20} color="red" />
          )}
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {state.reveal.isCorrect
                ? "Correct!"
                : state.reveal.selectedAnswerId === null
                  ? "No answer"
                  : "Wrong answer"}
            </Typography>
            {state.reveal.points > 0 && (
              <Typography variant="caption" color="text.secondary">
                +{state.reveal.points.toLocaleString()} pts
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" ml="auto">
            Waiting for next question…
          </Typography>
        </Box>
      )}

      {/* Submission confirmation, shown only while the question is still open.
          Deliberately says nothing about correctness: a coloured banner is
          readable across a room and hands the answer to everyone still
          deciding. It turns into the verdict above once the timer runs out. */}
      {state.hasAnswered && !state.reveal && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Lock size={18} />
          <Box>
            <Typography variant="body2" fontWeight={700}>
              Answer locked in
            </Typography>
            <Typography variant="caption" color="text.secondary">
              You&apos;ll see how you did when the timer runs out
            </Typography>
          </Box>
        </Box>
      )}

      {/* Answers */}
      <Stack spacing={1.5}>
        {question.answers.map((answer) => {
          const reveal = state.reveal;
          const isKey = reveal?.correctAnswerId === answer.id;
          const isMyWrongPick =
            reveal != null &&
            reveal.selectedAnswerId === answer.id &&
            !reveal.isCorrect;

          return (
            <Button
              key={answer.id}
              variant="outlined"
              fullWidth
              disabled={state.hasAnswered || reveal != null}
              onClick={() => submitAnswer(answer.id)}
              sx={{
                justifyContent: "flex-start",
                textAlign: "left",
                p: 2,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "0.95rem",
                // Before the reveal every option looks the same, whatever the
                // student picked. Afterwards the key is green and their own
                // wrong pick is red, as on the teacher's shared screen.
                opacity: reveal ? (isKey || isMyWrongPick ? 1 : 0.5) : state.hasAnswered ? 0.6 : 1,
                ...(isKey && {
                  borderColor: "success.main",
                  bgcolor: "success.light",
                  "&.Mui-disabled": { borderColor: "success.main", color: "text.primary" },
                }),
                ...(isMyWrongPick && {
                  borderColor: "error.main",
                  bgcolor: "error.light",
                  "&.Mui-disabled": { borderColor: "error.main", color: "text.primary" },
                }),
                "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
              }}
            >
              {answer.text}
              {isKey && " ✓"}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}
