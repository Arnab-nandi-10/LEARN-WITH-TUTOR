'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  ReceiptIndianRupee,
  ShieldCheck,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface WorkspaceNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  isActive?: (pathname: string) => boolean;
}

export interface WorkspaceNavGroup {
  label: string;
  items: WorkspaceNavItem[];
}

export interface WorkspaceRoleMeta {
  title: string;
  shellLabel: string;
  description: string;
  badgeClassName: string;
  accentClassName: string;
  profileHref: string;
  helpHref: string;
}

const matchesPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const matchesStudentCatalog = (pathname: string) =>
  matchesPath(pathname, '/student/courses') || matchesPath(pathname, '/student/checkout');

const matchesFacultyCourses = (pathname: string) =>
  matchesPath(pathname, '/faculty/courses') && !pathname.includes('/assessments');

const matchesFacultyAssessments = (pathname: string) =>
  pathname === '/faculty/assessments' ||
  pathname.includes('/assessments') ||
  pathname.includes('/exams');

export const workspaceRoleMeta: Record<UserRole, WorkspaceRoleMeta> = {
  student: {
    title: 'Student Workspace',
    shellLabel: 'Learning workspace',
    description: 'Stay on track, keep momentum, and move between catalog, progress, and assessments.',
    badgeClassName: 'border-[#223247] bg-[#0F1724] text-[#8DC7FF]',
    accentClassName: 'bg-sky-400',
    profileHref: '/student/profile',
    helpHref: '/#contact',
  },
  faculty: {
    title: 'Faculty Workspace',
    shellLabel: 'Teaching workspace',
    description: 'Manage your teaching surface, course delivery, and assessment operations from one shell.',
    badgeClassName: 'border-[#224035] bg-[#111A17] text-[#8DE8B6]',
    accentClassName: 'bg-emerald-400',
    profileHref: '/faculty/profile',
    helpHref: '/#contact',
  },
  admin: {
    title: 'Admin Workspace',
    shellLabel: 'Operations workspace',
    description: 'Control users, approvals, commerce, and analytics through one command surface.',
    badgeClassName: 'border-[#4B2416] bg-[#18120F] text-[#FFB48C]',
    accentClassName: 'bg-[#FF6A2A]',
    profileHref: '/admin/users',
    helpHref: '/#contact',
  },
};

export const workspaceNavigation: Record<UserRole, WorkspaceNavGroup[]> = {
  student: [
    {
      label: 'Learn',
      items: [
        {
          label: 'Dashboard',
          href: '/student/dashboard',
          icon: LayoutDashboard,
          description: 'Overview and recent progress',
        },
        {
          label: 'Browse Courses',
          href: '/student/courses',
          icon: BookOpen,
          description: 'Catalog, course detail, and checkout',
          isActive: matchesStudentCatalog,
        },
        {
          label: 'My Learning',
          href: '/student/enrolled',
          icon: GraduationCap,
          description: 'Active enrollments and learning history',
        },
      ],
    },
    {
      label: 'Account',
      items: [
        {
          label: 'Profile',
          href: '/student/profile',
          icon: User,
          description: 'Personal details and account settings',
        },
      ],
    },
  ],
  faculty: [
    {
      label: 'Teaching',
      items: [
        {
          label: 'Dashboard',
          href: '/faculty/dashboard',
          icon: LayoutDashboard,
          description: 'Course and teaching overview',
        },
        {
          label: 'My Courses',
          href: '/faculty/courses',
          icon: BookOpen,
          description: 'Create, edit, and publish courses',
          isActive: matchesFacultyCourses,
        },
        {
          label: 'Assessments',
          href: '/faculty/assessments',
          icon: ClipboardList,
          description: 'Exam overview and per-course assessments',
          isActive: matchesFacultyAssessments,
        },
        {
          label: 'Analytics',
          href: '/faculty/analytics',
          icon: BarChart3,
          description: 'Student progress and course metrics',
        },
      ],
    },
    {
      label: 'Account',
      items: [
        {
          label: 'Profile',
          href: '/faculty/profile',
          icon: User,
          description: 'Faculty identity and preferences',
        },
      ],
    },
  ],
  admin: [
    {
      label: 'Operations',
      items: [
        {
          label: 'Dashboard',
          href: '/admin/dashboard',
          icon: LayoutDashboard,
          description: 'Platform-wide command center',
        },
        {
          label: 'Users',
          href: '/admin/users',
          icon: Users,
          description: 'Verification and role oversight',
        },
        {
          label: 'Courses',
          href: '/admin/courses',
          icon: BookOpen,
          description: 'Review queue, pricing, and approvals',
        },
        {
          label: 'Payments',
          href: '/admin/payments',
          icon: CreditCard,
          description: 'Orders, verification, and revenue',
        },
        {
          label: 'Coupons',
          href: '/admin/coupons',
          icon: Ticket,
          description: 'Offer creation and discount control',
        },
        {
          label: 'Refunds',
          href: '/admin/refunds',
          icon: ReceiptIndianRupee,
          description: 'Policy rules and refund request queue',
        },
        {
          label: 'Analytics',
          href: '/admin/analytics',
          icon: BarChart3,
          description: 'Cross-platform performance signals',
        },
      ],
    },
  ],
};

export const workspaceUtilityLinks = [
  {
    label: 'Support',
    href: '/#contact',
    icon: LifeBuoy,
  },
  {
    label: 'Policies',
    href: '/',
    icon: ShieldCheck,
  },
];

export function isWorkspaceNavItemActive(item: WorkspaceNavItem, pathname: string) {
  if (item.isActive) {
    return item.isActive(pathname);
  }

  return matchesPath(pathname, item.href);
}

export function getWorkspaceSection(role: UserRole, pathname: string) {
  const groups = workspaceNavigation[role];

  for (const group of groups) {
    for (const item of group.items) {
      if (isWorkspaceNavItemActive(item, pathname)) {
        return {
          title: item.label,
          description: item.description,
          groupLabel: group.label,
        };
      }
    }
  }

  return {
    title: workspaceRoleMeta[role].title,
    description: workspaceRoleMeta[role].description,
    groupLabel: workspaceRoleMeta[role].shellLabel,
  };
}
