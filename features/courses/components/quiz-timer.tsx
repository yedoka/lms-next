"use client";

import { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";
import Box from "@mui/material/Box";

interface QuizTimerProps {
  timeLimitMinutes: number;
  onExpire: () => void;
}

export function QuizTimer({ timeLimitMinutes, onExpire }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const hasExpired = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasExpired.current) {
        hasExpired.current = true;
        onExpire();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 60;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        fontFamily: "monospace",
        fontSize: "1.125rem",
        fontWeight: 500,
        color: isWarning ? "error.main" : "text.secondary",
        ...(isWarning && {
          animation: "pulse 1s infinite",
          "@keyframes pulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.5 },
          },
        }),
      }}
    >
      <Clock size={18} />
      <span>
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </span>
    </Box>
  );
}
