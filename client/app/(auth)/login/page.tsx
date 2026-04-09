import LoginForm from '@/components/auth/LoginForm';

interface LoginPageProps {
  searchParams?: {
    portal?: string | string[];
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const portal =
    typeof searchParams?.portal === 'string'
      ? searchParams.portal
      : searchParams?.portal?.[0];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-primary">
      <LoginForm portal={portal} />
    </div>
  );
}
