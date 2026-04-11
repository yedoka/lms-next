"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Button onClick={() => signOut({ callbackUrl: "/auth/login" })}>
        Sign Out
      </Button>
    </div>
  );
}
