import { auth } from "@/auth";
import { ProfileDropdown } from "@/features/auth/components/profile-dropdown";
import { AppNavigation } from "@/shared/components/app-navigation";
import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/shared/ui/button";
import { ROUTES } from "@/features/auth/utils/routes";

async function PublicHeader() {
  const session = await auth();

  return (
    <AppNavigation 
      userRole={session?.user?.role} 
      userArea={
        session?.user ? (
          <ProfileDropdown
            name={session.user.name}
            email={session.user.email}
            role={session.user.role}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Link 
              href={ROUTES.AUTH_LOGIN} 
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Log in
            </Link>
            <Link 
              href={ROUTES.AUTH_SIGNUP} 
              className={buttonVariants({ size: "sm" })}
            >
              Sign up
            </Link>
          </div>
        )
      }
    />
  );
}

export default function CoursesLayout({
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
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            </div>
          </header>
        }
      >
        <PublicHeader />
      </Suspense>

      <main>
        {children}
      </main>
    </div>
  );
}
