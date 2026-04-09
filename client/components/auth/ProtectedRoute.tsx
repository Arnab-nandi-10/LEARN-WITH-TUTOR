'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/stores/authStore';
import { PageLoader } from '@/components/ui/Spinner';
import type { UserRole } from '@/lib/types';

// ============================================================
// PROTECTED ROUTE COMPONENT
// ============================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasHydrated, checkAuth } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    let isMounted = true;

    const validateAuth = async () => {
      try {
        await checkAuth();
      } finally {
        if (isMounted) {
          setHasCheckedAuth(true);
        }
      }
    };

    void validateAuth();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, checkAuth]);

  useEffect(() => {
    if (!hasHydrated || !hasCheckedAuth) return;

    // Wait for auth to load
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role authorization
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'student') {
        router.push('/student/dashboard');
      } else if (user.role === 'faculty') {
        router.push('/faculty/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [
    isAuthenticated,
    user,
    allowedRoles,
    router,
    redirectTo,
    isLoading,
    hasHydrated,
    hasCheckedAuth,
  ]);

  // Show loading while checking auth
  if (!hasHydrated || !hasCheckedAuth || isLoading) {
    return <PageLoader text="Loading..." />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <PageLoader text="Redirecting..." />;
  }

  // Not authorized for this route
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <PageLoader text="Redirecting..." />;
  }

  // Authorized - render children
  return <>{children}</>;
}
