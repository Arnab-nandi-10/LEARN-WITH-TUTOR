'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { loginSchema, type LoginFormData } from '@/lib/utils/validation';
import { useAuth } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { handleApiError } from '@/lib/api/client';

// ============================================================
// LOGIN FORM COMPONENT
// ============================================================

interface LoginFormProps {
  portal?: string;
}

export default function LoginForm({ portal }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const portalCopy = useMemo(() => {
    if (portal === 'admin') {
      return {
        title: 'Admin Console Access',
        description:
          'Sign in with an existing admin account to manage users, pricing, payments, refunds, and approvals.',
      };
    }

    if (portal === 'faculty') {
      return {
        title: 'Faculty Access',
        description:
          'Sign in to publish courses, manage lessons, and review assessments from your faculty workspace.',
      };
    }

    return {
      title: 'Welcome Back',
      description: 'Sign in to continue your learning journey',
    };
  }, [portal]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const loggedInUser = await login(data);
      
      toast.success('Login successful!');

      if (loggedInUser.role === 'student') {
        router.push('/student/dashboard');
      } else if (loggedInUser.role === 'faculty') {
        router.push('/faculty/dashboard');
      } else if (loggedInUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
          {portalCopy.title}
        </h1>
        <p className="text-text-secondary">
          {portalCopy.description}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl border border-border bg-bg-secondary p-2 text-xs">
        <Link
          href="/login?portal=student"
          className={`rounded-lg px-3 py-2 text-center transition-colors ${
            portal !== 'faculty' && portal !== 'admin'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          Student
        </Link>
        <Link
          href="/login?portal=faculty"
          className={`rounded-lg px-3 py-2 text-center transition-colors ${
            portal === 'faculty'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          Faculty
        </Link>
        <Link
          href="/login?portal=admin"
          className={`rounded-lg px-3 py-2 text-center transition-colors ${
            portal === 'admin'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          Admin
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          error={errors.email?.message}
          {...register('email')}
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
          disabled={isLoading}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
            />
            <span className="text-text-secondary">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link
          href={
            portal === 'admin'
              ? '/signup?role=admin'
              : portal === 'faculty'
                ? '/signup?role=faculty'
                : '/signup?role=student'
          }
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
