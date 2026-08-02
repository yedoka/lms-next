"use client";

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  // Refetch periodically and on window focus so a role change applied by an
  // admin is picked up promptly and SessionGuard can sign the user out.
  return (
    <SessionProvider refetchInterval={30} refetchOnWindowFocus>
      {children}
    </SessionProvider>
  );
}
