import { auth } from "@/auth";
import { ProfileDropdown } from "@/features/auth/components/profile-dropdown";
import { ROUTES } from "@/features/auth/utils/routes";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppNavigation } from "@/shared/components/app-navigation";
import { cn } from "@/shared/lib/utils";

async function ProtectedHeader() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.AUTH_LOGIN);
  }

  return (
    <AppNavigation 
      isProtected 
      userRole={session.user.role} 
      userArea={
        <ProfileDropdown
          name={session.user.name}
          email={session.user.email}
          role={session.user.role}
        />
      }
    />
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
          <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
            <div className="mx-auto flex w-full items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading navigation...</p>
              </div>
            </div>
          </header>
        }
      >
        <ProtectedHeader />
      </Suspense>

      <div className="flex flex-col lg:pl-64">
        <main className="flex-1 p-4 lg:p-8">
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Loading content...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
