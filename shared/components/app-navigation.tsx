"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, DASHBOARD_NAV } from "@/shared/lib/navigation";
import { UserRole } from "@prisma/client";
import { GraduationCap, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const SIDEBAR_WIDTH = 256;

interface AppNavigationProps {
  userRole?: UserRole;
  isProtected?: boolean;
  userArea?: React.ReactNode;
}

export function AppNavigation({
  userRole,
  isProtected,
  userArea,
}: AppNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const dashboardSections = userRole ? DASHBOARD_NAV[userRole] : [];
  const allDashboardItems = dashboardSections.flatMap((s) => s.items);

  const filteredMainNav = MAIN_NAV.filter(
    (item) => !item.roles || !userRole || item.roles.includes(userRole),
  );

  const isActive = (href: string, contextItems: { href: string }[] = []) => {
    if (pathname === href) return true;
    if (href === "/" && pathname !== "/") return false;
    const isPrefix = pathname.startsWith(href + "/");
    if (!isPrefix) return false;
    return !contextItems.some(
      (item) =>
        item.href !== href &&
        (pathname === item.href || pathname.startsWith(item.href + "/")) &&
        item.href.startsWith(href),
    );
  };

  // ---------------------------------------------------------------------------
  // Sidebar drawer content (shared between permanent + temporary)
  // ---------------------------------------------------------------------------
  const sidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          px: 3,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 700,
            color: "primary.main",
            textDecoration: "none",
            "&:hover": { opacity: 0.8 },
          }}
        >
          <GraduationCap size={24} />
          <Typography variant="subtitle1" fontWeight={700} color="primary">
            LMS Platform
          </Typography>
        </Box>
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
        {dashboardSections.map((section, idx) => (
          <Box key={idx} sx={{ mb: 2 }}>
            {section.title && (
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  display: "block",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "text.secondary",
                  fontSize: 11,
                }}
              >
                {section.title}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const active = isActive(item.href, allDashboardItems);
                return (
                  <ListItemButton
                    key={item.href}
                    href={item.href}
                    selected={active}
                    sx={{ borderRadius: 2, mb: 0.25 }}
                    aria-current={active ? "page" : undefined}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: active ? "inherit" : "text.secondary",
                      }}
                    >
                      <item.icon size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

    </Box>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      {isProtected && userRole && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              boxSizing: "border-box",
              border: "none",
              borderRight: 1,
              borderColor: "divider",
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Mobile temporary drawer */}
      {mounted && isProtected && userRole && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              boxSizing: "border-box",
            },
          }}
          ModalProps={{ keepMounted: true }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* AppBar / Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          color: "text.primary",
          zIndex: (theme) => theme.zIndex.drawer - 1,
          ...(isProtected && {
            width: { lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
            ml: { lg: `${SIDEBAR_WIDTH}px` },
          }),
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: "64px !important" }}>
          {/* Mobile menu button */}
          {isProtected && (
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { lg: "none" } }}
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </IconButton>
          )}

          {/* Logo (visible in header when sidebar is hidden on mobile, or on non-protected pages) */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: 700,
              color: "primary.main",
              textDecoration: "none",
              ...(isProtected && { display: { lg: "none" } }),
            }}
          >
            <GraduationCap size={24} />
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="primary"
              sx={{ display: { lg: "none" } }}
            >
              LMS
            </Typography>
          </Box>

          {/* Desktop main nav links (for non-protected pages) */}
          {filteredMainNav.length > 0 && (
            <Box
              component="nav"
              sx={{ display: { xs: "none", lg: "flex" }, gap: 0.5, ml: 2 }}
            >
              {filteredMainNav.map((item) => {
                const active = isActive(
                  item.href,
                  MAIN_NAV as { href: string }[],
                );
                return (
                  <Box
                    key={item.href}
                    component={Link}
                    href={item.href}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: "none",
                      color: active ? "primary.main" : "text.secondary",
                      "&:hover": { color: "primary.main" },
                      position: "relative",
                    }}
                  >
                    {item.title}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* User area */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {userArea}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
