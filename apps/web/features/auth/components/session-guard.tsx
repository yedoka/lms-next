"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import type { UserRole } from "@prisma/client";
import { ROUTES } from "@/features/auth/utils/routes";

interface SessionGuardProps {
  // The role the page was server-rendered with.
  role: UserRole;
}

// Watches the live session for a role change (an admin promoted/demoted this
// user) or an invalidated session, then signs the user out and sends them to
// the login page so the UI re-renders with the correct role-aware navigation.
// The server keeps the JWT role in sync; this only handles the client redirect.
export function SessionGuard({ role }: SessionGuardProps) {
  const { data, status } = useSession();
  const signingOut = useRef(false);

  useEffect(() => {
    if (signingOut.current) return;

    const roleChanged =
      status === "authenticated" &&
      !!data?.user?.role &&
      data.user.role !== role;
    const loggedOut = status === "unauthenticated";

    if (roleChanged || loggedOut) {
      signingOut.current = true;
      void signOut({ redirectTo: ROUTES.AUTH_LOGIN });
    }
  }, [data, status, role]);

  return null;
}
