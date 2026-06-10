"use client";

import { useState, useEffect, useCallback } from "react";
import { socket, setSocketAuthToken } from "@/shared/lib/socket";
import {
  getNotificationsAction,
  markAllAsReadAction,
} from "../actions/notification-actions";
import type { Notification } from "@prisma/client";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const load = useCallback(async () => {
    try {
      const data = await getNotificationsAction();
      setNotifications(data);
    } catch {
      // Not authenticated or fetch error — leave empty
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllAsReadAction();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })),
    );
  }, []);

  useEffect(() => {
    load();

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

    function onNewNotification(payload: {
      id: string;
      type: string;
      message: string;
      createdAt: string;
    }) {
      const incoming: Notification = {
        id: payload.id,
        userId: "",
        type: payload.type,
        message: payload.message,
        readAt: null,
        createdAt: new Date(payload.createdAt),
      };
      setNotifications((prev) => [incoming, ...prev]);
    }

    socket.on("notification:new", onNewNotification);
    // Refresh the token and reconnect whenever the socket drops so that
    // a rotated NextAuth session doesn't leave the client in a ghost state.
    socket.on("disconnect", connectSocket);
    connectSocket();

    return () => {
      socket.off("notification:new", onNewNotification);
      socket.off("disconnect", connectSocket);
      socket.disconnect();
    };
  }, [load]);

  return { notifications, unreadCount, markAllRead };
}
