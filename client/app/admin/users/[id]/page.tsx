'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, BadgeCheck, BookOpen, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import * as businessApi from '@/lib/api/business';
import * as coursesApi from '@/lib/api/courses';
import * as usersApi from '@/lib/api/users';
import type { Course, EnrollmentWithCourse, User } from '@/lib/types';

export default function AdminUserDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingVerification, setTogglingVerification] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const requestedRole = searchParams.get('role');
        const scopedRole =
          requestedRole === 'admin' ||
          requestedRole === 'faculty' ||
          requestedRole === 'student'
            ? requestedRole
            : null;
        const selectedUser =
          scopedRole
            ? await businessApi.getAdminScopedUser(scopedRole, userId)
            : await usersApi.getUserById(userId);
        const resolvedUser =
          scopedRole || !selectedUser?.role
            ? selectedUser
            : await businessApi
                .getAdminScopedUser(selectedUser.role, userId)
                .catch(() => selectedUser);
        const knownCourses = await coursesApi
          .getAllKnownCourses()
          .catch(() => coursesApi.getCachedCourses());
        setUser(resolvedUser);

        if (resolvedUser.role === 'faculty') {
          setCourses(
            knownCourses.filter((course) => course.faculty_id === resolvedUser._id)
          );
          setEnrollments([]);
        } else if (resolvedUser.role === 'student') {
          const enrollmentHistory = await usersApi
            .getUserEnrollments(userId)
            .catch(() => []);

          setEnrollments(enrollmentHistory);
          setCourses([]);
        } else {
          setCourses([]);
          setEnrollments([]);
        }
      } catch (err) {
        console.error('Failed to load admin user detail:', err);
        setError('Failed to load the selected user.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [searchParams, userId]);

  const courseStats = useMemo(() => {
    return {
      total: courses.length,
      published: courses.filter((course) => course.status === 'published').length,
      approved: courses.filter((course) => course.isApproved).length,
    };
  }, [courses]);

  const enrollmentStats = useMemo(() => {
    return {
      total: enrollments.length,
      active: enrollments.filter((enrollment) => enrollment.status === 'active').length,
      completed: enrollments.filter((enrollment) => enrollment.status === 'completed')
        .length,
    };
  }, [enrollments]);

  const handleToggleVerification = async () => {
    if (!user) return;

    try {
      setTogglingVerification(true);
      const result = await businessApi.toggleUserVerification(user._id);
      setUser((current) =>
        current ? { ...current, is_verified: result.is_verified } : current
      );
      toast.success(
        result.is_verified
          ? 'User verified successfully.'
          : 'User moved back to pending verification.'
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update verification');
    } finally {
      setTogglingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-text-secondary">Loading user details...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Card className="border-red-500/30">
          <CardContent className="py-8 text-center">
            <p className="text-red-400">{error || 'User not found.'}</p>
            <div className="mt-4">
              <Link href="/admin/users">
                <Button variant="secondary">Back to Users</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/users"
        className="mb-6 inline-flex items-center gap-2 text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <section className="mb-8 rounded-[32px] border border-[#1E1E1E] bg-[linear-gradient(180deg,#111315_0%,#0C0E11_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  user.role === 'admin'
                    ? 'warning'
                    : user.role === 'faculty'
                      ? 'info'
                      : 'default'
                }
              >
                {user.role}
              </Badge>
              <Badge variant={user.is_verified ? 'success' : 'warning'}>
                {user.is_verified ? 'verified' : 'pending'}
              </Badge>
            </div>
            <h1
              className="text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {user.name}
            </h1>
            <p className="mt-3 text-sm text-[#9AA3AD]">{user.email}</p>
          </div>

          <div className="w-full max-w-sm rounded-[24px] border border-[#1D2127] bg-[#12161B] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E7782]">
              Account controls
            </p>
            <p className="mt-3 text-sm text-[#8C9198]">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-1 text-sm text-[#8C9198]">
              Updated {new Date(user.updatedAt).toLocaleDateString()}
            </p>
            <Button
              variant={user.is_verified ? 'secondary' : 'primary'}
              onClick={handleToggleVerification}
              disabled={togglingVerification}
              className="mt-4 w-full rounded-[14px]"
            >
              {togglingVerification ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : user.is_verified ? (
                'Revoke verification'
              ) : (
                'Verify account'
              )}
            </Button>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Account status"
          value={user.is_verified ? 'Verified' : 'Pending'}
          icon={
            user.is_verified ? (
              <BadgeCheck className="h-4 w-4 text-green-500" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-yellow-500" />
            )
          }
        />
        <MetricCard
          label={
            user.role === 'faculty'
              ? 'Owned courses'
              : user.role === 'student'
                ? 'Enrolled courses'
                : 'Managed accounts'
          }
          value={
            user.role === 'faculty'
              ? String(courseStats.total)
              : user.role === 'student'
                ? String(enrollmentStats.total)
                : '—'
          }
        />
        <MetricCard
          label={
            user.role === 'faculty'
              ? 'Approved courses'
              : user.role === 'student'
                ? 'Completed enrollments'
                : 'Verification state'
          }
          value={
            user.role === 'faculty'
              ? String(courseStats.approved)
              : user.role === 'student'
                ? String(enrollmentStats.completed)
                : user.is_verified
                  ? 'Verified'
                  : 'Pending'
          }
        />
      </div>

      {user.role === 'faculty' ? (
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
          <CardHeader>
            <CardTitle>Faculty Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-text-secondary">
                This faculty member does not have any tracked courses yet.
              </div>
            ) : (
              courses.map((course) => (
                <div
                  key={course._id}
                  className="flex flex-col gap-3 rounded-[22px] border border-[#1D2127] bg-[#12161B] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#FAFAFA]">{course.title}</p>
                      <Badge
                        variant={
                          course.status === 'published' ? 'success' : 'warning'
                        }
                      >
                        {course.status}
                      </Badge>
                      <Badge variant={course.isApproved ? 'success' : 'warning'}>
                        {course.isApproved ? 'approved' : 'review queue'}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#8C9198]">
                      {course.total_modules} modules • {course.total_duration} min
                    </p>
                  </div>
                  <Link href={`/admin/courses/${course._id}`}>
                    <Button variant="secondary" size="sm">
                      <BookOpen className="h-4 w-4" />
                      Review course
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : user.role === 'student' ? (
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
          <CardHeader>
            <CardTitle>Enrollment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrollments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-text-secondary">
                This student does not have any enrollments yet.
              </div>
            ) : (
              enrollments.map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="flex flex-col gap-3 rounded-[22px] border border-[#1D2127] bg-[#12161B] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#FAFAFA]">
                        {enrollment.course?.title ||
                          `Course #${String(enrollment.course_id).slice(-6)}`}
                      </p>
                      <Badge
                        variant={
                          enrollment.status === 'completed' ? 'success' : 'info'
                        }
                      >
                        {enrollment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#8C9198]">
                      Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/admin/courses/${enrollment.course_id}`}>
                    <Button variant="secondary" size="sm">
                      <BookOpen className="h-4 w-4" />
                      Review course
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
          <CardHeader>
            <CardTitle>User Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[#8C9198]">
            This admin account does not own course inventory, so the detail view focuses
            on verification state and account metadata.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="rounded-[24px] border-[#1D2025] bg-[#101317]">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 text-[#858C95]">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-semibold text-[#FAFAFA]">{value}</p>
      </CardContent>
    </Card>
  );
}
