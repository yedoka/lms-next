"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface QuizTimerProps {
  timeLimitMinutes: number;
  onExpire: () => void;
}

export function QuizTimer({ timeLimitMinutes, onExpire }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
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
    <div
      className={cn(
        "flex items-center gap-2 font-mono text-lg font-medium",
        isWarning ? "text-destructive animate-pulse" : "text-muted-foreground",
      )}
    >
      <Clock className="w-5 h-5" />
      <span>
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
