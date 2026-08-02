import { auth } from "@/auth";
import { ProfileDropdown } from "@/features/auth/components/profile-dropdown";
import { AppNavigation } from "@/shared/components/app-navigation";
import { Suspense } from "react";
import { ROUTES } from "@/features/auth/utils/routes";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";

async function PublicHeader() {
  const session = await auth();

  return (
    <AppNavigation
      isProtected={!!session?.user}
      userRole={session?.user?.role}
      userArea={
        session?.user ? (
          <ProfileDropdown
            name={session.user.name}
            email={session.user.email}
            role={session.user.role}
          />
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button href={ROUTES.AUTH_LOGIN} variant="text">
              Log in
            </Button>
            <Button href={ROUTES.AUTH_SIGNUP} variant="contained" size="small">
              Sign up
            </Button>
          </Box>
        )
      }
    />
  );
}

export default async function CoursesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

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
        <PublicHeader />
      </Suspense>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          ...(session?.user && { pl: { lg: "256px" } }),
        }}
      >
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3, lg: 4 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
