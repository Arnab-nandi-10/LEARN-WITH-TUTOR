'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CircleDollarSign,
  CreditCard,
  RotateCcw,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { loadAdminOverview, type AdminCourseInsight } from '@/lib/admin/overview';
import * as businessApi from '@/lib/api/business';
import { formatCurrency } from '@/lib/commerce';
import type { Payment, Refund, User } from '@/lib/types';

type RecentActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'user' | 'course' | 'payment' | 'refund';
};

const formatRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(Math.floor(diffMs / (1000 * 60 * 60)), 0);

  if (diffHours < 1) return 'Less than 1 hour ago';
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString();
};

const buildRecentActivity = (
  users: User[],
  courses: AdminCourseInsight[],
  payments: Payment[],
  refunds: Refund[]
): RecentActivityItem[] => {
  const userActivity = users.slice(0, 4).map((user) => ({
    id: `user-${user._id}`,
    title: 'New user joined',
    description: `${user.name} signed up as ${user.role}.`,
    timestamp: user.createdAt,
    type: 'user' as const,
  }));
  const courseActivity = courses.slice(0, 4).map((item) => ({
    id: `course-${item.course._id}`,
    title: item.course.isApproved ? 'Course approved' : 'Course awaiting review',
    description: `${item.course.title} now has ${item.enrolledStudents} learners and ${item.totalAttempts} attempts.`,
    timestamp: item.course.updatedAt,
    type: 'course' as const,
  }));
  const paymentActivity = payments.slice(0, 4).map((payment) => ({
    id: `payment-${payment._id}`,
    title:
      payment.status === 'success'
        ? 'Payment captured'
        : payment.status === 'pending'
          ? 'Payment awaiting verification'
          : 'Payment failed',
    description: `${payment.items[0]?.courseData?.title || 'Course purchase'} • ${formatCurrency(payment.amount)}`,
    timestamp: payment.paidAt || payment.createdAt,
    type: 'payment' as const,
  }));
  const refundActivity = refunds.slice(0, 4).map((refund) => ({
    id: `refund-${refund._id}`,
    title: 'Refund request received',
    description: `${refund.courseData?.title || 'Course'} • ${refund.studentData?.name || 'Learner'}`,
    timestamp: refund.createdAt,
    type: 'refund' as const,
  }));

  return [...userActivity, ...courseActivity, ...paymentActivity, ...refundActivity]
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )
    .slice(0, 8);
};

export default function AdminDashboard() {
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<AdminCourseInsight[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const [overview, paymentData, refundData] = await Promise.all([
          loadAdminOverview(),
          businessApi.getAllAdminPayments().catch(() => []),
          businessApi.getRefundRequests().catch(() => []),
        ]);
        const adminUser = await businessApi.getCurrentAdminUser().catch(() => null);
        setCurrentAdmin(adminUser);
        setUsers(overview.users);
        setCourses(overview.courses);
        setPayments(paymentData);
        setRefunds(refundData);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
        setError('Failed to load admin dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const stats = useMemo(() => {
    const totalEnrollments = courses.reduce(
      (sum, item) => sum + item.enrolledStudents,
      0
    );
    const verifiedUsers = users.filter((user) => user.is_verified).length;
    const successfulPayments = payments.filter((payment) => payment.status === 'success');

    return [
      {
        label: 'Total users',
        value: users.length,
        helper: 'All registered accounts',
        icon: Users,
        color: 'text-blue-500',
      },
      {
        label: 'Verified users',
        value: verifiedUsers,
        helper: 'Accounts ready to use',
        icon: BadgeCheck,
        color: 'text-green-500',
      },
      {
        label: 'Approved courses',
        value: courses.filter((item) => item.course.isApproved).length,
        helper: 'Catalog-ready learning products',
        icon: BookOpen,
        color: 'text-accent',
      },
      {
        label: 'Gross revenue',
        value: formatCurrency(
          successfulPayments.reduce((sum, payment) => sum + payment.amount, 0)
        ),
        helper: 'Successful course payments',
        icon: CircleDollarSign,
        color: 'text-orange-500',
      },
      {
        label: 'Refund queue',
        value: refunds.length,
        helper: 'Requests awaiting review',
        icon: RotateCcw,
        color: 'text-yellow-500',
      },
      {
        label: 'Enrollments',
        value: totalEnrollments,
        helper: 'Students across tracked courses',
        icon: Activity,
        color: 'text-cyan-500',
      },
    ];
  }, [courses, payments, refunds, users]);

  const recentActivity = useMemo(
    () => buildRecentActivity(users, courses, payments, refunds),
    [courses, payments, refunds, users]
  );

  return (
    <div className="space-y-8">
      <section className="mb-8 rounded-[32px] border border-[#1E1E1E] bg-[linear-gradient(180deg,#101214_0%,#0B0D10_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-[#FF6A2A]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Admin Command Center
            </p>
            <h1
              className="mt-3 text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              One view for content, payments, and refunds
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8D9298]">
              The dashboard now includes the business operations layer, so you can monitor
              users, course approvals, revenue, and refund requests from the same admin
              surface.
            </p>
            {currentAdmin ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#242A31] bg-[#13171C] px-4 py-2 text-sm text-[#C8D2DB]">
                Signed in as {currentAdmin.name}
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">
                Manage users
              </Button>
            </Link>
            <Link href="/admin/courses">
              <Button variant="outline" className="w-full">
                Review courses
              </Button>
            </Link>
            <Link href="/admin/payments">
              <Button variant="outline" className="w-full">
                Payments
              </Button>
            </Link>
            <Link href="/admin/coupons">
              <Button variant="outline" className="w-full">
                Coupons
              </Button>
            </Link>
            <Link href="/admin/refunds">
              <Button variant="outline" className="w-full">
                Refunds
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full">
                Analytics
              </Button>
            </Link>
            <Link href="/student/courses">
              <Button variant="outline" className="w-full">
                Browse catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <Card className="mb-8 border-red-500/30">
          <CardContent className="py-4 text-sm text-red-400">{error}</CardContent>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.label}
              className="rounded-[24px] border-[#1D2025] bg-[#101317]"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="mb-1 text-sm text-[#858C95]">{stat.label}</p>
                    <p className="text-3xl font-bold text-[#FAFAFA]">
                      {loading ? '—' : stat.value}
                    </p>
                    <p className="mt-2 text-xs text-[#6E7782]">{stat.helper}</p>
                  </div>
                  <div className={`rounded-[18px] bg-[#151A21] p-3 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-sm text-[#8C9198]">
                  Latest user signups, approval updates, payments, and refund requests.
                </p>
              </div>
              <Badge variant="info">{recentActivity.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-[#8C9198]">Loading activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-[#8C9198]">
                Activity will appear here as platform operations pick up.
              </p>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-[22px] border border-[#1D2127] bg-[#12161B] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant={
                          item.type === 'payment'
                            ? 'success'
                            : item.type === 'refund'
                              ? 'warning'
                              : item.type === 'course'
                                ? 'info'
                                : 'default'
                        }
                      >
                        {item.type}
                      </Badge>
                      <p className="font-medium text-[#FAFAFA]">{item.title}</p>
                    </div>
                    <p className="text-sm text-[#8C9198]">{item.description}</p>
                  </div>
                  <span className="text-xs text-[#6E7782]">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
            <CardHeader>
              <CardTitle>Commerce Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SnapshotRow
                label="Pending payment verifications"
                value={String(
                  payments.filter((payment) => payment.status === 'pending').length
                )}
              />
              <SnapshotRow
                label="Successful transactions"
                value={String(
                  payments.filter((payment) => payment.status === 'success').length
                )}
              />
              <SnapshotRow
                label="Refund requests"
                value={String(refunds.length)}
              />
              <Link
                href="/admin/payments"
                className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
              >
                Open payment workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
            <CardHeader>
              <CardTitle>Platform Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[22px] bg-[#12161B] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#FAFAFA]">
                  <UserPlus className="h-4 w-4 text-accent" />
                  <span className="font-medium">Role Mix</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <RoleTile
                    label="Students"
                    value={String(users.filter((user) => user.role === 'student').length)}
                  />
                  <RoleTile
                    label="Faculty"
                    value={String(users.filter((user) => user.role === 'faculty').length)}
                  />
                  <RoleTile
                    label="Admins"
                    value={String(users.filter((user) => user.role === 'admin').length)}
                  />
                </div>
              </div>

              <div className="rounded-[22px] bg-[#12161B] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="font-medium text-[#FAFAFA]">Top Courses</p>
                  <Link
                    href="/admin/courses"
                    className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {courses.length === 0 ? (
                  <p className="text-sm text-[#8C9198]">
                    Course insights will appear here once content is available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {courses.slice(0, 4).map((item) => (
                      <div
                        key={item.course._id}
                        className="rounded-[18px] border border-[#1D2127] p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="line-clamp-1 font-medium text-[#FAFAFA]">
                            {item.course.title}
                          </p>
                          <Badge
                            variant={item.course.isApproved ? 'success' : 'warning'}
                          >
                            {item.course.isApproved ? 'approved' : 'review'}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#8C9198]">
                          {item.enrolledStudents} learners • {item.totalAttempts} attempts
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#1D2127] bg-[#12161B] px-4 py-3">
      <span className="text-sm text-[#8C9198]">{label}</span>
      <span className="text-sm font-semibold text-[#FAFAFA]">{value}</span>
    </div>
  );
}

function RoleTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[#6E7782]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#FAFAFA]">{value}</p>
    </div>
  );
}
