'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WorkspaceShell from '@/components/layouts/WorkspaceShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <WorkspaceShell userRole="admin">{children}</WorkspaceShell>
    </ProtectedRoute>
  );
}
