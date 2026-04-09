'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3,
  ClipboardList,
  CreditCard,
  GraduationCap, 
  ReceiptIndianRupee,
  Ticket,
  User,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole: 'student' | 'faculty' | 'admin';
}

const studentLinks = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Browse Courses', href: '/student/courses', icon: BookOpen },
  { label: 'My Learning', href: '/student/enrolled', icon: GraduationCap },
  { label: 'Profile', href: '/student/profile', icon: User },
];

const facultyLinks = [
  { label: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
  { label: 'My Courses', href: '/faculty/courses', icon: BookOpen },
  { label: 'Assessments', href: '/faculty/assessments', icon: ClipboardList },
  { label: 'Analytics', href: '/faculty/analytics', icon: BarChart3 },
  { label: 'Create Course', href: '/faculty/courses/new', icon: GraduationCap },
  { label: 'Profile', href: '/faculty/profile', icon: User },
];

const adminLinks = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: User },
  { label: 'All Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { label: 'Refunds', href: '/admin/refunds', icon: ReceiptIndianRupee },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = userRole === 'student' 
    ? studentLinks 
    : userRole === 'faculty' 
    ? facultyLinks 
    : adminLinks;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-xs font-display">TL</span>
          </div>
          <span className="text-text-primary font-display font-bold text-lg">
            Tutor
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive 
                  ? 'bg-accent text-white' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-text-muted text-center">
          © 2024 Tutor Labs
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg-card border border-border rounded-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-bg-secondary border-r border-border flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        'lg:hidden fixed left-0 top-0 h-full w-64 bg-bg-secondary border-r border-border z-50 transform transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}
