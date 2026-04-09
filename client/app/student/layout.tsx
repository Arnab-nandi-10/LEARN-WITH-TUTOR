'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WorkspaceShell from '@/components/layouts/WorkspaceShell';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <WorkspaceShell userRole="student">{children}</WorkspaceShell>
    </ProtectedRoute>
  );
}
