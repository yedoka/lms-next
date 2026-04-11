"use client";

import { Button } from "@/components/ui/button";
import { ROLE_LABELS, getRoleBadgeClassName } from "@/lib/rbac";
import { ROUTES } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import { signOut } from "next-auth/react";

type ProfileDropdownProps = {
  name?: string | null;
  email?: string | null;
  role: UserRole;
};

export function ProfileDropdown({ name, email, role }: ProfileDropdownProps) {
  const displayName = name?.trim() || "User";

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
        Profile
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-xl">
        <p className="text-sm font-semibold">{displayName}</p>
        {email ? (
          <p className="text-xs text-muted-foreground">{email}</p>
        ) : null}

        <div className="mt-3">
          <p className="text-xs text-muted-foreground">Role</p>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold",
              getRoleBadgeClassName(role),
            )}
          >
            {ROLE_LABELS[role]}
          </span>
        </div>

        <Button
          className="mt-4 w-full"
          variant="outline"
          onClick={() => signOut({ callbackUrl: ROUTES.AUTH_LOGIN })}
        >
          Sign Out
        </Button>
      </div>
    </details>
  );
}
