'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { signupSchema, type SignupFormData } from '@/lib/utils/validation';
import { useAuth } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { handleApiError } from '@/lib/api/client';

// ============================================================
// SIGNUP FORM COMPONENT
// ============================================================

interface SignupFormProps {
  requestedRole?: string;
}

export default function SignupForm({ requestedRole }: SignupFormProps) {
  const router = useRouter();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const enableAdminSignup = process.env.NEXT_PUBLIC_ENABLE_ADMIN_SIGNUP === 'true';
  const initialRole = useMemo<SignupFormData['role']>(() => {
    if (
      requestedRole === 'student' ||
      requestedRole === 'faculty' ||
      (requestedRole === 'admin' && enableAdminSignup)
    ) {
      return requestedRole;
    }

    return 'student';
  }, [enableAdminSignup, requestedRole]);
  const roleOptions = useMemo(
    () => [
      { value: 'student', label: 'Student - I want to learn' },
      { value: 'faculty', label: 'Faculty - I want to teach' },
      ...(enableAdminSignup
        ? [{ value: 'admin', label: 'Admin - I manage the platform' }]
        : []),
    ],
    [enableAdminSignup]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: initialRole,
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    setValue('role', initialRole, { shouldValidate: true });
  }, [initialRole, setValue]);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      const createdUser = await signup(data);
      
      toast.success('Account created successfully!');

      if (createdUser.role === 'student') {
        router.push('/student/dashboard');
      } else if (createdUser.role === 'faculty') {
        router.push('/faculty/dashboard');
      } else if (createdUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
          Create Account
        </h1>
        <p className="text-text-secondary">
          Choose the workspace you want to enter and create your account.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl border border-border bg-bg-secondary p-2 text-xs">
        <Link
          href="/signup?role=student"
          className={`rounded-lg px-3 py-2 text-center transition-colors ${
            selectedRole === 'student'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          Student
        </Link>
        <Link
          href="/signup?role=faculty"
          className={`rounded-lg px-3 py-2 text-center transition-colors ${
            selectedRole === 'faculty'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          Faculty
        </Link>
        <Link
          href={enableAdminSignup ? '/signup?role=admin' : '/login?portal=admin'}
          className={`rounded-lg px-3 py-2 text-center transition-colors ${
            selectedRole === 'admin'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          Admin
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register('name')}
          disabled={isLoading}
        />

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
          helperText="Must be at least 6 characters"
          error={errors.password?.message}
          {...register('password')}
          disabled={isLoading}
        />

        <Select
          label="I am a..."
          options={roleOptions}
          value={selectedRole}
          error={errors.role?.message}
          {...register('role')}
          disabled={isLoading}
        />

        {selectedRole === 'admin' ? (
          <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-text-secondary">
            Admin signup is disabled by default. Use the bootstrap admin account or set
            <code className="mx-1 rounded bg-bg-elevated px-1.5 py-0.5 text-xs text-text-primary">
              NEXT_PUBLIC_ENABLE_ADMIN_SIGNUP=true
            </code>
            if you intentionally want to allow it.
          </div>
        ) : null}

        <div className="text-xs text-text-muted">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-accent hover:text-accent-hover">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-accent hover:text-accent-hover">
            Privacy Policy
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link
          href={
            selectedRole === 'admin'
              ? '/login?portal=admin'
              : selectedRole === 'faculty'
                ? '/login?portal=faculty'
                : '/login?portal=student'
          }
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
