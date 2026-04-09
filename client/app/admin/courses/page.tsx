'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, BookOpen, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { loadAdminOverview, type AdminCourseInsight } from '@/lib/admin/overview';
import * as businessApi from '@/lib/api/business';
import { formatCurrency } from '@/lib/commerce';
import type { User } from '@/lib/types';

type CourseFilter =
  | 'all'
  | 'approved'
  | 'needs-review'
  | 'published'
  | 'draft';

export default function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourseInsight[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<CourseFilter>('all');
  const [updatingCourseId, setUpdatingCourseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadAdminOverview();
        setCourses(data.courses);
        setUsers(data.users);
      } catch (err) {
        console.error('Failed to fetch admin courses:', err);
        setError('Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const facultyMap = useMemo(() => {
    return new Map(users.map((user) => [user._id, user.name]));
  }, [users]);

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return courses.filter((item) => {
      const approvalState = item.course.isApproved ? 'approved' : 'needs-review';
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'approved' || filter === 'needs-review'
            ? approvalState === filter
            : item.course.status === filter;
      const facultyName = facultyMap.get(item.course.faculty_id)?.toLowerCase() || '';
      const matchesSearch =
        query.length === 0 ||
        item.course.title.toLowerCase().includes(query) ||
        item.course.description.toLowerCase().includes(query) ||
        facultyName.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [courses, facultyMap, filter, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: courses.length,
      approved: courses.filter((item) => item.course.isApproved).length,
      needsReview: courses.filter((item) => !item.course.isApproved).length,
      students: courses.reduce((sum, item) => sum + item.enrolledStudents, 0),
    };
  }, [courses]);

  const handleToggleApproval = async (courseId: string) => {
    try {
      setUpdatingCourseId(courseId);
      const result = await businessApi.toggleCourseApproval(courseId);
      setCourses((current) =>
        current.map((item) =>
          item.course._id === courseId
            ? {
                ...item,
                course: {
                  ...item.course,
                  isApproved: result.isApproved,
                },
              }
            : item
        )
      );
      toast.success(
        result.isApproved
          ? 'Course approved for the marketplace.'
          : 'Course moved back to the review queue.'
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update course approval');
    } finally {
      setUpdatingCourseId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="mb-8 rounded-[32px] border border-[#1E1E1E] bg-[linear-gradient(180deg,#101214_0%,#0B0D10_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-[#FF6A2A]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Course Operations
            </p>
            <h1
              className="mt-3 text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Review, price, and publish courses
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8D9298]">
              This workspace combines content oversight with the new business approval
              workflow so you can decide what reaches the storefront and at what price.
            </p>
          </div>
          <div className="w-full max-w-xl">
            <Input
              placeholder="Search by course title, description, or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-[16px] border-[#252A31] bg-[#111418] text-[#FAFAFA] placeholder:text-[#6E7782]"
            />
          </div>
        </div>
      </section>

      {error && (
        <Card className="mb-6 border-red-500/30">
          <CardContent className="py-4 text-sm text-red-400">{error}</CardContent>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Known courses" value={loading ? '—' : String(stats.total)} />
        <MetricCard label="Approved" value={loading ? '—' : String(stats.approved)} />
        <MetricCard
          label="Review queue"
          value={loading ? '—' : String(stats.needsReview)}
        />
        <MetricCard
          label="Tracked learners"
          value={loading ? '—' : String(stats.students)}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'approved', 'needs-review', 'published', 'draft'] as const).map(
          (value) => (
            <Button
              key={value}
              variant={filter === value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(value)}
              className="capitalize"
            >
              {value === 'needs-review' ? 'review queue' : value}
            </Button>
          )
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-text-secondary">
            Loading courses...
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-text-muted" />
            <p className="text-text-secondary">
              No courses match your current search and filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {filteredCourses.map((item) => {
            const facultyName =
              facultyMap.get(item.course.faculty_id) ||
              `Faculty ${item.course.faculty_id.slice(-4)}`;
            const isApproved = Boolean(item.course.isApproved);
            const isUpdating = updatingCourseId === item.course._id;

            return (
              <Card
                key={item.course._id}
                className="overflow-hidden rounded-[28px] border-[#1E1E1E] bg-[#0F1114] p-0 transition-colors hover:border-[#2A3038]"
              >
                <div className="bg-[linear-gradient(130deg,rgba(255,106,42,0.24),rgba(17,20,24,0.94)_38%,rgba(13,15,18,0.98)_78%)] p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        item.course.status === 'published' ? 'success' : 'warning'
                      }
                    >
                      {item.course.status}
                    </Badge>
                    <Badge variant={isApproved ? 'success' : 'warning'}>
                      {isApproved ? 'approved' : 'review queue'}
                    </Badge>
                    <Badge className="border-[#2C3641] bg-[#13171C] text-[#B1C2CF]">
                      {item.course.category}
                    </Badge>
                  </div>
                  <h3
                    className="text-2xl font-semibold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {item.course.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#A2ABB4]">
                    {item.course.description}
                  </p>
                </div>

                <CardContent className="space-y-5 p-6">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile label="Modules" value={String(item.course.total_modules)} />
                    <StatTile label="Lessons" value={String(item.totalLessons)} />
                    <StatTile label="Learners" value={String(item.enrolledStudents)} />
                    <StatTile label="Attempts" value={String(item.totalAttempts)} />
                  </div>

                  <div className="grid gap-3 rounded-[22px] border border-[#1D2127] bg-[#12161B] p-4 sm:grid-cols-2">
                    <DetailLine label="Faculty" value={facultyName} />
                    <DetailLine
                      label="Live price"
                      value={
                        item.course.price === 0
                          ? 'Free'
                          : formatCurrency(item.course.price)
                      }
                    />
                    <DetailLine
                      label="Storefront"
                      value={isApproved ? 'Visible to admin-approved flows' : 'Held for review'}
                    />
                    <DetailLine
                      label="Updated"
                      value={new Date(item.course.updatedAt).toLocaleDateString()}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex items-center gap-2 text-sm text-[#8C9198]">
                      {isApproved ? (
                        <BadgeCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Users className="h-4 w-4 text-[#FFB45E]" />
                      )}
                      {isApproved
                        ? 'Approved and ready for commercial sale'
                        : 'Waiting for admin business review'}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={isApproved ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleApproval(item.course._id)}
                        disabled={isUpdating}
                        className="rounded-[14px]"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : isApproved ? (
                          'Move to review'
                        ) : (
                          'Approve'
                        )}
                      </Button>
                      <Link href={`/admin/courses/${item.course._id}`}>
                        <Button variant="ghost" size="sm" className="rounded-[14px]">
                          Review details
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[24px] border-[#1D2025] bg-[#101317]">
      <CardContent className="py-4">
        <p className="text-sm text-[#858C95]">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-[#FAFAFA]">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#1D2127] bg-[#111418] p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E7782]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[#FAFAFA]">{value}</p>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E7782]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[#FAFAFA]">{value}</p>
    </div>
  );
}
