import SignupForm from '@/components/auth/SignupForm';

interface SignupPageProps {
  searchParams?: {
    role?: string | string[];
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const role =
    typeof searchParams?.role === 'string'
      ? searchParams.role
      : searchParams?.role?.[0];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-primary">
      <SignupForm requestedRole={role} />
    </div>
  );
}
