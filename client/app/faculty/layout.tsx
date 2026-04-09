'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WorkspaceShell from '@/components/layouts/WorkspaceShell';

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <WorkspaceShell userRole="faculty">{children}</WorkspaceShell>
    </ProtectedRoute>
  );
}
