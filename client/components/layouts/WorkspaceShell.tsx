'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/stores/authStore';
import type { UserRole } from '@/lib/types';
import {
  getWorkspaceSection,
  isWorkspaceNavItemActive,
  workspaceNavigation,
  workspaceRoleMeta,
  workspaceUtilityLinks,
} from './workspaceNavigation';

interface WorkspaceShellProps {
  userRole: UserRole;
  children: React.ReactNode;
}

export default function WorkspaceShell({
  userRole,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const roleMeta = workspaceRoleMeta[userRole];
  const sectionMeta = useMemo(
    () => getWorkspaceSection(userRole, pathname),
    [pathname, userRole]
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setLoggingOut(false);
    }
  };

  const initials = (user?.name || 'User')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const navigation = workspaceNavigation[userRole];

  const shellNav = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-white/5 px-5 pb-5 pt-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF7A30,#FF5C00)] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(255,92,0,0.25)]">
            TL
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[#FAFAFA]">
              Tutor Labs
            </p>
            <p className="truncate text-xs text-[#7E8791]">{roleMeta.title}</p>
          </div>
        </Link>

        <div
          className={cn(
            'mt-5 rounded-[22px] border px-4 py-4',
            roleMeta.badgeClassName
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn('h-2.5 w-2.5 rounded-full', roleMeta.accentClassName)}
            />
            <p className="text-[11px] uppercase tracking-[0.18em]">
              {roleMeta.shellLabel}
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#D7DEE6]">
            {roleMeta.description}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {navigation.map((group) => (
            <div key={group.label} className="min-w-0">
              <p className="px-3 text-[11px] uppercase tracking-[0.18em] text-[#5F6A75]">
                {group.label}
              </p>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isWorkspaceNavItemActive(item, pathname);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      className={cn(
                        'group flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-[20px] border px-3 py-3 transition-all duration-200',
                        isActive
                          ? 'border-[#2B323C] bg-[#14181D] text-[#FAFAFA] shadow-[0_10px_28px_rgba(0,0,0,0.14)]'
                          : 'border-transparent text-[#8A949F] hover:border-[#212831] hover:bg-[#101419] hover:text-[#E6EDF3]'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border transition-colors',
                          isActive
                            ? 'border-white/10 bg-white/5 text-[#FAFAFA]'
                            : 'border-[#1A2028] bg-[#0E1217] text-[#6E7782] group-hover:text-[#C6D0D9]'
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.label}</p>
                        <p className="truncate text-xs text-[#5F6A75]">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-4">
        <div className="rounded-[22px] border border-[#1A2028] bg-[#0E1217] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#141A20] text-sm font-semibold text-[#FAFAFA]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#FAFAFA]">
                {user?.name || 'Workspace user'}
              </p>
              <p className="truncate text-xs capitalize text-[#7E8791]">
                {user?.email || `${userRole} portal`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={roleMeta.profileHref}
              className="rounded-[14px] border border-[#212831] bg-[#11161C] px-3 py-2 text-center text-xs font-medium text-[#D8E0E8] transition-colors hover:border-[#2E3742] hover:bg-[#151B22]"
            >
              Profile
            </Link>
            <Link
              href={roleMeta.helpHref}
              className="rounded-[14px] border border-[#212831] bg-[#11161C] px-3 py-2 text-center text-xs font-medium text-[#D8E0E8] transition-colors hover:border-[#2E3742] hover:bg-[#151B22]"
            >
              Help
            </Link>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#2C1B16] bg-[#18100D] px-3 py-2 text-sm font-medium text-[#FFB48C] transition-colors hover:border-[#4B2416] hover:bg-[#20120D] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,92,0,0.08),transparent_24%),linear-gradient(180deg,#0A0B0D_0%,#090A0C_100%)] text-text-primary">
      <div className="flex min-h-dvh w-full">
        <aside className="hidden h-dvh min-w-[304px] max-w-[304px] shrink-0 overflow-hidden border-r border-white/5 bg-[#0B0F13]/96 backdrop-blur-xl lg:flex xl:min-w-[320px] xl:max-w-[320px]">
          {shellNav}
        </aside>

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-[rgba(4,7,11,0.72)] backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            'fixed inset-y-2 left-2 z-50 w-[20rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0F13] shadow-[0_30px_80px_rgba(0,0,0,0.45)] transition-transform duration-300 lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {shellNav}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 shrink-0 border-b border-white/5 bg-[rgba(9,11,14,0.88)] backdrop-blur-xl">
            <div className="flex h-20 w-full items-center gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
              <button
                onClick={() => setMobileOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#1D252E] bg-[#0F141A] text-[#E6EDF3] transition-colors hover:border-[#2B3641] hover:bg-[#131A22] lg:hidden"
                aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#66707A]">
                  {sectionMeta.groupLabel}
                </p>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                  <h1
                    className="truncate text-xl font-semibold text-[#FAFAFA] sm:text-2xl"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {sectionMeta.title}
                  </h1>
                  <span
                    className={cn(
                      'hidden rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] md:inline-flex',
                      roleMeta.badgeClassName
                    )}
                  >
                    {userRole}
                  </span>
                </div>
                <p className="mt-1 hidden max-w-3xl truncate text-sm text-[#7E8791] sm:block">
                  {sectionMeta.description}
                </p>
              </div>

              <div className="hidden items-center gap-3 xl:flex">
                {workspaceUtilityLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex h-11 items-center gap-2 rounded-[16px] border border-[#1D252E] bg-[#0F141A] px-4 text-sm text-[#D7DFE7] transition-colors hover:border-[#2B3641] hover:bg-[#131A22]"
                    >
                      <Icon className="h-4 w-4 text-[#FF6A2A]" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="flex items-center gap-3 rounded-[18px] border border-[#1D252E] bg-[#0F141A] px-4 py-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#141A20] text-sm font-semibold text-[#FAFAFA]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#FAFAFA]">
                      {user?.name || 'Workspace user'}
                    </p>
                    <p className="truncate text-xs capitalize text-[#7E8791]">
                      {user?.role || userRole}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex w-full flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
