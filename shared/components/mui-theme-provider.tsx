"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/shared/lib/mui-theme";

export function MuiThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
