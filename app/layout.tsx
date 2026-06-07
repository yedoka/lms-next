import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "next-themes";
import { MuiThemeProvider } from "@/shared/components/mui-theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
