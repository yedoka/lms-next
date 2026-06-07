import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "next-themes";
import { MuiThemeProvider } from "@/shared/components/mui-theme-provider";
import { inter } from "@/shared/lib/mui-theme";

export const metadata: Metadata = {
  title: "LMS",
  description: "Learning Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.className}
    >
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <MuiThemeProvider>
              {children}
              <Toaster />
            </MuiThemeProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
