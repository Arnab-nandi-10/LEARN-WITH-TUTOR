import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Tutor Labs',
  description: 'Sign in or create an account to access Tutor Labs',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
