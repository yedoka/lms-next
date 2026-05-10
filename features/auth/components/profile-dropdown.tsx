"use client";

import { Button } from "@/shared/ui/button";
import { ROLE_LABELS } from "@/features/auth/utils/rbac";
import { ROUTES } from "@/features/auth/utils/routes";
import { ChevronDown } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { signOut } from "next-auth/react";

type ProfileDropdownProps = {
  name?: string | null;
  email?: string | null;
  role: UserRole;
};

export function ProfileDropdown({ name, email, role }: ProfileDropdownProps) {
  const displayName = name?.trim() || "User";
  const initial = displayName[0].toUpperCase();

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer">
        <div className="flex items-center gap-2.5 rounded-full px-3 py-1.5 hover:bg-accent transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium select-none">
            {initial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{ROLE_LABELS[role]}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-lg shadow-black/5 ring-1 ring-foreground/5">
        <div className="px-1 pb-2 border-b border-border">
          <p className="text-sm font-semibold">{displayName}</p>
          {email && <p className="text-xs text-muted-foreground mt-0.5">{email}</p>}
        </div>

        <Button
          className="mt-2 w-full"
          variant="outline"
          onClick={() => signOut({ callbackUrl: ROUTES.AUTH_LOGIN })}
        >
          Sign out
        </Button>
      </div>
    </details>
  );
}
