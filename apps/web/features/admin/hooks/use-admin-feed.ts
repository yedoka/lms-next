"use client";

import { useState, useEffect } from "react";
import { socket, setSocketAuthToken } from "@/shared/lib/socket";

export interface AdminEvent {
  kind: "signup" | "enrollment" | "quiz_completed";
  label: string;
  at: string;
}

const MAX_EVENTS = 50;

export function useAdminFeed() {
  const [events, setEvents] = useState<AdminEvent[]>([]);

  useEffect(() => {
    async function connectSocket() {
      try {
        const res = await fetch("/api/auth/socket-token");
        if (!res.ok) return;
        const { token } = (await res.json()) as { token: string };
        setSocketAuthToken(token);
        if (!socket.connected) socket.connect();
      } catch {
        // Silent — socket is non-critical
      }
    }

    function onActivity(event: AdminEvent) {
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
    }

    socket.on("admin:activity", onActivity);
    socket.on("disconnect", connectSocket);
    connectSocket();

    return () => {
      socket.off("admin:activity", onActivity);
      socket.off("disconnect", connectSocket);
    };
  }, []);

  return { events };
}
