import { auth } from "@/auth";
import { ProfileDropdown } from "@/features/auth/components/profile-dropdown";
import { ROUTES } from "@/features/auth/utils/routes";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppNavigation } from "@/shared/components/app-navigation";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Suspense
        fallback={
          <Box
            component="header"
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              height: 64,
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              px: { xs: 2, lg: 3 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 2 }}>
              <Skeleton variant="text" width={128} height={24} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </Box>
        }
      >
        <ProtectedHeader />
      </Suspense>

      <Box sx={{ display: "flex", flexDirection: "column", pl: { lg: "256px" } }}>
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3, lg: 4 } }}>
          <Suspense
            fallback={
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
                <Skeleton variant="rectangular" width="100%" height={64} sx={{ borderRadius: 2 }} />
              </Box>
            }
          >
            {children}
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
