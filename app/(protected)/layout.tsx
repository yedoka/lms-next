import { auth } from "@/auth";
import { ProfileDropdown } from "@/features/auth/components/profile-dropdown";
import { ROUTES } from "@/features/auth/utils/routes";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function ProtectedHeader() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.AUTH_LOGIN);
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">LMS Dashboard</p>
          <p className="text-xs text-muted-foreground">
            Role-based access control is active
          </p>
        </div>

        <ProfileDropdown
          name={session.user.name}
          email={session.user.email}
          role={session.user.role}
        />
      </div>
    </header>
  );
}

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <header className="border-b border-border">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">LMS Dashboard</p>
                <p className="text-xs text-muted-foreground">Loading...</p>
              </div>
            </div>
          </header>
        }
      >
        <ProtectedHeader />
      </Suspense>

      <main className="mx-auto w-full max-w-5xl p-4">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading page content...</p>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
