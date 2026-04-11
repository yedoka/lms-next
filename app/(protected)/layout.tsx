import { auth } from "@/auth";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
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

      <main className="mx-auto w-full max-w-5xl p-4">{children}</main>
    </div>
  );
}
