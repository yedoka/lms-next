import { ROUTES } from "@/features/auth/utils/routes";
import { ROLE } from "@/features/auth/utils/roles";
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  Users, 
  GraduationCap,
  PlusCircle,
  Library,
  ShieldCheck
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

export const MAIN_NAV: NavItem[] = [
  {
    title: "All Courses",
    href: ROUTES.COURSES,
    icon: Library,
    description: "Browse our catalog of courses",
  },
];

export const DASHBOARD_NAV: Record<UserRole, NavSection[]> = {
  [ROLE.STUDENT]: [
    {
      title: "Learning",
      items: [
        {
          title: "My Dashboard",
          href: ROUTES.DASHBOARD_STUDENT,
          icon: LayoutDashboard,
        },
        {
          title: "My Courses",
          href: ROUTES.DASHBOARD_STUDENT_COURSES,
          icon: BookOpen,
        },
      ],
    },
  ],
  [ROLE.TEACHER]: [
    {
      title: "Teaching",
      items: [
        {
          title: "Teacher Dashboard",
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
          title: "Admin Dashboard",
          href: ROUTES.DASHBOARD_ADMIN,
          icon: LayoutDashboard,
        },
        {
          title: "User Management",
          href: ROUTES.DASHBOARD_ADMIN_USERS,
          icon: Users,
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
