'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Clock,
  Loader2,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import * as analyticsApi from '@/lib/api/analytics';
import * as businessApi from '@/lib/api/business';
import * as coursesApi from '@/lib/api/courses';
import * as usersApi from '@/lib/api/users';
import { formatCurrency } from '@/lib/commerce';
import type { Analytics, Course, FullCourse, User } from '@/lib/types';

export default function AdminCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [courseData, setCourseData] = useState<FullCourse | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [faculty, setFaculty] = useState<User | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);
  const [togglingApproval, setTogglingApproval] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [fullCourse, overview, users, managedCourse] = await Promise.all([
          coursesApi.getFullCourse(courseId),
          analyticsApi.getCourseAnalytics(courseId).catch(() => null),
          usersApi.getAllUsers().catch(() => []),
          businessApi.getManagedCourseById(courseId).catch(() => null),
        ]);

        const mergedCourse: Course = managedCourse
          ? {
              ...fullCourse.course,
              ...managedCourse,
            }
          : fullCourse.course;

        setCourseData({
          ...fullCourse,
          course: mergedCourse,
        });
        setAnalytics(overview);
        setFaculty(users.find((user) => user._id === mergedCourse.faculty_id) || null);
        setPriceInput(String(mergedCourse.price));
      } catch (err) {
        console.error('Failed to load admin course detail:', err);
        setError('Failed to load the selected course.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const totalLessons = useMemo(() => {
    if (!courseData) return 0;
    return courseData.modules.reduce(
      (sum, module) => sum + (module.lessons?.length || 0),
      0
    );
  }, [courseData]);

  const handleToggleApproval = async () => {
    if (!courseData) return;

    try {
      setTogglingApproval(true);
      const result = await businessApi.toggleCourseApproval(courseId);
      setCourseData((current) =>
        current
          ? {
              ...current,
              course: {
                ...current.course,
                isApproved: result.isApproved,
              },
            }
          : current
      );
      toast.success(
        result.isApproved
          ? 'Course approved for the marketplace.'
          : 'Course moved back to the review queue.'
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update course approval');
    } finally {
      setTogglingApproval(false);
    }
  };

  const handleUpdatePrice = async () => {
    const nextPrice = Number(priceInput);

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast.error('Enter a valid non-negative price.');
      return;
    }

    try {
      setSavingPrice(true);
      const result = await businessApi.updateManagedCoursePrice(courseId, nextPrice);
      setCourseData((current) =>
        current
          ? {
              ...current,
              course: {
                ...current.course,
                price: result.price,
              },
            }
          : current
      );
      setPriceInput(String(result.price));
      toast.success('Course price updated successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update course price');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseData) return;

    const confirmed = window.confirm(
      `Delete "${courseData.course.title}" from the platform? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCourse(true);
      await businessApi.deleteManagedCourse(courseId);
      toast.success('Course deleted successfully.');
      router.push('/admin/courses');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete course');
    } finally {
      setDeletingCourse(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-text-secondary">Loading course details...</p>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="space-y-4">
        <Card className="border-red-500/30">
          <CardContent className="py-8 text-center">
            <p className="text-red-400">{error || 'Course not found.'}</p>
            <div className="mt-4">
              <Link href="/admin/courses">
                <Button variant="secondary">Back to Courses</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isApproved = Boolean(courseData.course.isApproved);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/courses"
        className="mb-6 inline-flex items-center gap-2 text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <section className="mb-8 rounded-[32px] border border-[#1E1E1E] bg-[linear-gradient(180deg,#111315_0%,#0C0E11_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  courseData.course.status === 'published' ? 'success' : 'warning'
                }
              >
                {courseData.course.status}
              </Badge>
              <Badge variant={isApproved ? 'success' : 'warning'}>
                {isApproved ? 'approved' : 'review queue'}
              </Badge>
              <Badge variant="info">{courseData.course.category}</Badge>
            </div>
            <h1
              className="text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {courseData.course.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9AA3AD]">
              {courseData.course.description}
            </p>
            <p className="mt-4 text-sm text-[#7E8791]">
              Faculty owner:{' '}
              <span className="text-[#FAFAFA]">
                {faculty?.name || courseData.course.faculty_id}
              </span>
            </p>
          </div>

          <div className="w-full max-w-md rounded-[24px] border border-[#1D2127] bg-[#12161B] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E7782]">
              Commercial controls
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[18px] border border-[#20252C] bg-[#0F1318] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#8C9198]">Marketplace state</p>
                    <p className="mt-2 text-lg font-semibold text-[#FAFAFA]">
                      {isApproved ? 'Approved for sale' : 'Needs review'}
                    </p>
                  </div>
                  <BadgeCheck
                    className={`h-5 w-5 ${isApproved ? 'text-green-500' : 'text-[#FFB45E]'}`}
                  />
                </div>
                <Button
                  variant={isApproved ? 'secondary' : 'primary'}
                  onClick={handleToggleApproval}
                  disabled={togglingApproval}
                  className="mt-4 w-full rounded-[14px]"
                >
                  {togglingApproval ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isApproved ? (
                    'Move to review queue'
                  ) : (
                    'Approve for storefront'
                  )}
                </Button>
              </div>

              <div className="rounded-[18px] border border-[#20252C] bg-[#0F1318] p-4">
                <div className="mb-4 flex items-center gap-2 text-[#FAFAFA]">
                  <WalletCards className="h-4 w-4 text-[#FF6A2A]" />
                  <span className="text-sm font-medium">Course pricing</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={priceInput}
                  onChange={(event) => setPriceInput(event.target.value)}
                  className="rounded-[14px] border-[#252A31] bg-[#13181E] text-[#FAFAFA]"
                />
                <p className="mt-3 text-sm text-[#8C9198]">
                  Current learner price:{' '}
                  <span className="font-medium text-[#FAFAFA]">
                    {courseData.course.price === 0
                      ? 'Free'
                      : formatCurrency(courseData.course.price)}
                  </span>
                </p>
                <Button
                  variant="primary"
                  onClick={handleUpdatePrice}
                  disabled={savingPrice}
                  className="mt-4 w-full rounded-[14px]"
                >
                  {savingPrice ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update price'
                  )}
                </Button>
              </div>

              <Button
                variant="danger"
                onClick={handleDeleteCourse}
                disabled={deletingCourse}
                className="w-full rounded-[14px]"
              >
                {deletingCourse ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete course'
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Modules" value={String(courseData.modules.length)} />
        <MetricCard label="Lessons" value={String(totalLessons)} />
        <MetricCard label="Learners" value={String(analytics?.total_students || 0)} />
        <MetricCard label="Attempts" value={String(analytics?.total_attempts || 0)} />
        <MetricCard label="Duration" value={`${courseData.course.total_duration} min`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
          <CardHeader>
            <CardTitle>Course Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courseData.modules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-text-secondary">
                No modules have been added to this course yet.
              </div>
            ) : (
              courseData.modules.map((module, moduleIndex) => (
                <div
                  key={module._id}
                  className="rounded-[22px] border border-[#1D2127] bg-[#12161B] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#FAFAFA]">
                        {moduleIndex + 1}. {module.title}
                      </p>
                      <p className="text-sm text-[#8C9198]">
                        {(module.lessons || []).length} lessons
                      </p>
                    </div>
                    <BookOpen className="h-5 w-5 text-[#FF6A2A]" />
                  </div>
                  {module.lessons && module.lessons.length > 0 ? (
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson._id}
                          className="rounded-[16px] bg-[#0F1318] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-[#FAFAFA]">
                              {lessonIndex + 1}. {lesson.title}
                            </p>
                            <span className="text-xs uppercase tracking-[0.14em] text-[#7E8791]">
                              {lesson.type}
                            </span>
                          </div>
                          <div className="mt-2 inline-flex items-center gap-2 text-xs text-[#7E8791]">
                            <Clock className="h-3.5 w-3.5" />
                            {lesson.duration} min
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#8C9198]">
                      No lessons in this module yet.
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#0F1114]">
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PerformanceTile
              label="Progress records"
              value={String(analytics?.total_progress_records || 0)}
            />
            <PerformanceTile
              label="Exam attempts"
              value={String(analytics?.total_attempts || 0)}
            />
            <PerformanceTile
              label="Price"
              value={
                courseData.course.price === 0
                  ? 'Free'
                  : formatCurrency(courseData.course.price)
              }
            />
            <PerformanceTile
              label="Last updated"
              value={new Date(courseData.course.updatedAt).toLocaleDateString()}
            />
          </CardContent>
        </Card>
      </div>
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

function PerformanceTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#1D2127] bg-[#12161B] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E7782]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[#FAFAFA]">{value}</p>
    </div>
  );
}
