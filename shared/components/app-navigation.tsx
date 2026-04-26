"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { ROUTES } from "@/features/auth/utils/routes";
import { MAIN_NAV, DASHBOARD_NAV } from "@/shared/lib/navigation";
import { UserRole } from "@prisma/client";
import { 
  ChevronRight, 
  Menu,
  X,
  GraduationCap,
  Settings
} from "lucide-react";
import { useState, useEffect } from "react";

interface AppNavigationProps {
  userRole?: UserRole;
  isProtected?: boolean;
  userArea?: React.ReactNode;
}

export function AppNavigation({ userRole, isProtected, userArea }: AppNavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const dashboardSections = userRole ? DASHBOARD_NAV[userRole] : [];
  
  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    // Specific check for dashboard home to avoid highlighting it for all sub-routes if needed,
    // but usually for sidebars, prefix matching is good.
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  return (
    <>
      {/* Desktop Sidebar (Only for protected dashboard routes) */}
      {isProtected && userRole && (
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:block">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b border-border px-6">
              <Link href="/" className="flex items-center gap-2 font-bold text-primary hover:opacity-80 transition-opacity">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="text-lg tracking-tight">LMS Platform</span>
              </Link>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
              {dashboardSections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  {section.title && (
                    <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                            active 
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon className={cn(
                            "h-4 w-4 transition-colors", 
                            active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                          )} />
                          <span>{item.title}</span>
                          {active && <ChevronRight className="ml-auto h-4 w-4 animate-in slide-in-from-left-1" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            
            <div className="mt-auto border-t border-border p-4">
              <Link
                href={ROUTES.DASHBOARD_SETTINGS}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                  isActive(ROUTES.DASHBOARD_SETTINGS)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6 transition-all",
        isProtected && "lg:pl-64" // Adjust header when sidebar is present (pl-64 matches sidebar width)
      )}>
        <div className="flex items-center gap-4">
          {isProtected && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden transition-colors"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </button>
          )}
          
          <Link href="/" className={cn("flex items-center gap-2 font-bold text-primary", isProtected && "lg:hidden")}>
            <GraduationCap className="h-6 w-6" />
            <span className="text-lg">LMS</span>
          </Link>

          {/* Main Nav Links (Desktop) */}
          <nav className="hidden items-center gap-1 lg:flex ml-4">
            {MAIN_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                    active 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {item.title}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[17px] h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User area */}
        <div className="flex items-center gap-4">
          {userArea}
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-[280px] border-r border-border bg-card p-6 shadow-2xl animate-in slide-in-from-left duration-300 ease-in-out">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-2 font-bold text-primary">
                <GraduationCap className="h-8 w-8" />
                <span className="text-xl">LMS Platform</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close sidebar</span>
              </button>
            </div>

            <nav className="space-y-8">
              {/* Main Nav in Mobile */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-2">
                  General
                </h3>
                <div className="space-y-1">
                  {MAIN_NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all",
                        isActive(item.href) 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Dashboard Nav in Mobile */}
              {isProtected && userRole && dashboardSections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  {section.title && (
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-2">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all",
                            active 
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {isProtected && (
                <div className="pt-4 border-t border-border">
                  <Link
                    href={ROUTES.DASHBOARD_SETTINGS}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all",
                      isActive(ROUTES.DASHBOARD_SETTINGS)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
