import { ROUTES } from "@/features/auth/utils/routes";
import { ROLE } from "@/features/auth/utils/roles";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  PlusCircle,
  Library,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
  description?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const MAIN_NAV: NavItem[] = [];

export const DASHBOARD_NAV: Record<UserRole, NavSection[]> = {
  [ROLE.STUDENT]: [
    {
      title: "Learning",
      items: [
        {
          title: "Overview",
          href: ROUTES.DASHBOARD_STUDENT,
          icon: LayoutDashboard,
        },
        {
          title: "My Courses",
          href: ROUTES.DASHBOARD_STUDENT_COURSES,
          icon: BookOpen,
        },
        {
          title: "All Courses",
          href: ROUTES.COURSES,
          icon: Library,
          description: "Browse our catalog of courses",
        },
      ],
    },
  ],
  [ROLE.TEACHER]: [
    {
      title: "Teaching",
      items: [
        {
          title: "Overview",
          href: ROUTES.DASHBOARD_TEACHER,
          icon: LayoutDashboard,
        },
        {
          title: "Manage Courses",
          href: ROUTES.DASHBOARD_TEACHER_COURSES,
          icon: GraduationCap,
        },
        {
          title: "Create Course",
          href: ROUTES.DASHBOARD_TEACHER_COURSE_CREATE,
          icon: PlusCircle,
        },
      ],
    },
  ],
  [ROLE.ADMIN]: [
    {
      title: "Administration",
      items: [
        {
          title: "Overview",
          href: ROUTES.DASHBOARD_ADMIN,
          icon: LayoutDashboard,
        },
        {
          title: "User Management",
          href: ROUTES.DASHBOARD_ADMIN_USERS,
          icon: Users,
        },
        {
          title: "Courses",
          href: ROUTES.DASHBOARD_ADMIN_COURSES,
          icon: BookOpen,
        },
        {
          title: "Role Requests",
          href: ROUTES.DASHBOARD_ADMIN_REQUESTS,
          icon: UserCog,
        },
        {
          title: "System Settings",
          href: ROUTES.DASHBOARD_ADMIN_SETTINGS,
          icon: ShieldCheck,
        },
      ],
    },
  ],
};
