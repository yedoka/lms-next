"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { socket, setSocketAuthToken } from "@/shared/lib/socket";

export type SessionStatus =
  | "idle"
  | "lobby"
  | "active"
  | "ended"
  | "error";

export interface QuestionData {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "BOOLEAN";
  /** isCorrect is present on the teacher's view, absent on the student's view */
  answers: { id: string; text: string; isCorrect?: boolean }[];
  index: number;
  total: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
}

export interface LiveSessionState {
  status: SessionStatus;
  title: string;
  code: string;
  currentQuestion: QuestionData | null;
  questionStartedAt: string | null;
  secondsPerQuestion: number;
  leaderboard: LeaderboardEntry[];
  answeredCount: number;
  totalQuestions: number;
  hasAnswered: boolean;
  score: number;
  lastAnswer: { isCorrect: boolean; points: number } | null;
  error: string | null;
}

const defaultState: LiveSessionState = {
  status: "idle",
  title: "",
  code: "",
  currentQuestion: null,
  questionStartedAt: null,
  secondsPerQuestion: 20,
  leaderboard: [],
  answeredCount: 0,
  totalQuestions: 0,
  hasAnswered: false,
  score: 0,
  lastAnswer: null,
  error: null,
};

export function useLiveSession() {
  const [state, setState] = useState<LiveSessionState>(defaultState);
  const codeRef = useRef<string>("");

  const connectSocket = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/socket-token");
      if (!res.ok) return;
      const { token } = (await res.json()) as { token: string };
      setSocketAuthToken(token);
      if (!socket.connected) socket.connect();
    } catch {
      // socket is non-critical
    }
  }, []);

  useEffect(() => {
    connectSocket();
    socket.on("disconnect", connectSocket);

    function onSessionState(data: Partial<LiveSessionState> & { code?: string; status?: SessionStatus }) {
      setState((prev) => ({
        ...prev,
        status: (data.status as SessionStatus) ?? prev.status,
        title: (data as { title?: string }).title ?? prev.title,
        code: (data as { code?: string }).code ?? prev.code,
        currentQuestion:
          (data as { currentQuestion?: QuestionData | null }).currentQuestion !== undefined
            ? (data as { currentQuestion?: QuestionData | null }).currentQuestion ?? null
            : prev.currentQuestion,
        questionStartedAt:
          (data as { questionStartedAt?: string | null }).questionStartedAt !== undefined
            ? (data as { questionStartedAt?: string | null }).questionStartedAt ?? null
            : prev.questionStartedAt,
        secondsPerQuestion:
          (data as { secondsPerQuestion?: number }).secondsPerQuestion ?? prev.secondsPerQuestion,
        leaderboard: (data as { leaderboard?: LeaderboardEntry[] }).leaderboard ?? prev.leaderboard,
        answeredCount: (data as { answeredCount?: number }).answeredCount ?? prev.answeredCount,
        totalQuestions: (data as { totalQuestions?: number }).totalQuestions ?? prev.totalQuestions,
        hasAnswered: (data as { hasAnswered?: boolean }).hasAnswered ?? prev.hasAnswered,
        score: (data as { score?: number }).score ?? prev.score,
        error: null,
      }));
    }

    function onLobbyUpdate(data: { leaderboard: LeaderboardEntry[] }) {
      setState((prev) => ({ ...prev, leaderboard: data.leaderboard }));
    }

    function onQuestionShow(data: {
      question: QuestionData;
      questionStartedAt: string;
      secondsPerQuestion: number;
      answeredCount?: number;
    }) {
      setState((prev) => ({
        ...prev,
        status: "active",
        currentQuestion: data.question,
        questionStartedAt: data.questionStartedAt,
        secondsPerQuestion: data.secondsPerQuestion,
        answeredCount: data.answeredCount ?? 0,
        hasAnswered: false,
        lastAnswer: null,
      }));
    }

    function onLeaderboardUpdate(data: {
      leaderboard: LeaderboardEntry[];
      answeredCount: number;
    }) {
      setState((prev) => ({
        ...prev,
        leaderboard: data.leaderboard,
        answeredCount: data.answeredCount,
      }));
    }

    function onAnswerReceived(data: { isCorrect: boolean; points: number }) {
      setState((prev) => ({
        ...prev,
        hasAnswered: true,
        score: prev.score + (data.points ?? 0),
        lastAnswer: { isCorrect: data.isCorrect, points: data.points ?? 0 },
      }));
    }

    function onSessionFinal(data: { leaderboard: LeaderboardEntry[] }) {
      setState((prev) => ({
        ...prev,
        status: "ended",
        leaderboard: data.leaderboard,
      }));
    }

    function onSessionError(data: { message: string }) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: data.message,
      }));
    }

    socket.on("session:state", onSessionState);
    socket.on("lobby:update", onLobbyUpdate);
    socket.on("question:show", onQuestionShow);
    socket.on("leaderboard:update", onLeaderboardUpdate);
    socket.on("answer:received", onAnswerReceived);
    socket.on("session:final", onSessionFinal);
    socket.on("session:error", onSessionError);

    return () => {
      socket.off("disconnect", connectSocket);
      socket.off("session:state", onSessionState);
      socket.off("lobby:update", onLobbyUpdate);
      socket.off("question:show", onQuestionShow);
      socket.off("leaderboard:update", onLeaderboardUpdate);
      socket.off("answer:received", onAnswerReceived);
      socket.off("session:final", onSessionFinal);
      socket.off("session:error", onSessionError);
      // Do NOT disconnect — NotificationBell manages the shared socket lifecycle
    };
  }, [connectSocket]);

  const joinSession = useCallback((code: string) => {
    codeRef.current = code;
    setState((prev) => ({
      ...prev,
      code,
      status: "lobby",
      error: null,
    }));
    if (socket.connected) {
      socket.emit("session:join", { code });
    } else {
      socket.once("connect", () => {
        socket.emit("session:join", { code });
      });
    }
  }, []);

  const startSession = useCallback(() => {
    socket.emit("session:start", { code: codeRef.current });
  }, []);

  const nextQuestion = useCallback(() => {
    socket.emit("question:next", { code: codeRef.current });
  }, []);

  const endSession = useCallback(() => {
    socket.emit("session:end", { code: codeRef.current });
  }, []);

  const submitAnswer = useCallback((answerId: string) => {
    socket.emit("answer:submit", {
      code: codeRef.current,
      answerId,
    });
  }, []);

  return {
    state,
    joinSession,
    startSession,
    nextQuestion,
    endSession,
    submitAnswer,
  };
}
