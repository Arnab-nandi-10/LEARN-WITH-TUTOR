'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import * as enrollmentsApi from '@/lib/api/enrollments';
import * as progressApi from '@/lib/api/progress';
import type { CourseProgressSummary, EnrollmentWithCourse } from '@/lib/types';

export default function EnrolledCourses() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [progressByCourse, setProgressByCourse] = useState<
    Record<string, CourseProgressSummary>
  >({});
  const [progressLoadingByCourse, setProgressLoadingByCourse] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const data = await enrollmentsApi.getMyEnrollments();
        setEnrollments(data);
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  useEffect(() => {
    if (enrollments.length === 0) {
      setProgressByCourse({});
      setProgressLoadingByCourse({});
      return;
    }

    let cancelled = false;
    const courseIds = Array.from(
      new Set(enrollments.map((enrollment) => enrollment.course_id))
    );

    setProgressLoadingByCourse(
      courseIds.reduce<Record<string, boolean>>((acc, courseId) => {
        acc[courseId] = true;
        return acc;
      }, {})
    );

    const fetchProgressSummaries = async () => {
      const entries = await Promise.all(
        courseIds.map(async (courseId) => {
          try {
            const summary = await progressApi.getCourseProgress(courseId);
            return [courseId, summary] as const;
          } catch (error) {
            return [courseId, null] as const;
          }
        })
      );

      if (cancelled) {
        return;
      }

      const nextProgressByCourse: Record<string, CourseProgressSummary> = {};
      const nextLoadingByCourse: Record<string, boolean> = {};

      entries.forEach(([courseId, summary]) => {
        if (summary) {
          nextProgressByCourse[courseId] = summary;
        }
        nextLoadingByCourse[courseId] = false;
      });

      setProgressByCourse(nextProgressByCourse);
      setProgressLoadingByCourse(nextLoadingByCourse);
    };

    void fetchProgressSummaries();

    return () => {
      cancelled = true;
    };
  }, [enrollments]);

  const filteredEnrollments = enrollments.filter(e => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
          My Learning
        </h1>
        <p className="text-text-secondary">
          Track your enrolled courses and continue where you left off.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setFilter('all')}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            <p className="text-sm text-text-secondary">Total Courses</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setFilter('active')}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.active}</p>
            <p className="text-sm text-text-secondary">In Progress</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setFilter('completed')}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            <p className="text-sm text-text-secondary">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === 'all' ? 'All Courses' : f}
          </Button>
        ))}
      </div>

      {/* Course List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-32 h-24 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {filter === 'all' ? 'No enrolled courses' : `No ${filter} courses`}
            </h3>
            <p className="text-text-secondary mb-4">
              {filter === 'all' 
                ? 'Start learning by browsing our course catalog.'
                : `You don't have any ${filter} courses yet.`}
            </p>
            {filter === 'all' && (
              <Link href="/student/courses">
                <Button variant="primary">Browse Courses</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEnrollments.map((enrollment) => (
            <EnrollmentCard
              key={enrollment._id}
              enrollment={enrollment}
              progress={progressByCourse[enrollment.course_id] || null}
              loadingProgress={Boolean(progressLoadingByCourse[enrollment.course_id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollmentCard({
  enrollment,
  progress,
  loadingProgress,
}: {
  enrollment: EnrollmentWithCourse;
  progress: CourseProgressSummary | null;
  loadingProgress: boolean;
}) {
  const isCompleted = enrollment.status === 'completed';
  const progressPercentage = progress?.percentage || 0;

  return (
    <Card className="hover:border-accent/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Thumbnail */}
          <div className="w-full sm:w-32 h-24 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-10 h-10 text-accent" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge variant={isCompleted ? 'success' : 'info'} className="mb-2">
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      In Progress
                    </>
                  )}
                </Badge>
                <h3 className="font-semibold text-text-primary">
                  {enrollment.course?.title || `Course #${enrollment.course_id.slice(-6)}`}
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  Enrolled on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">Progress</span>
                <span className="text-text-primary font-medium">
                  {loadingProgress ? '--' : `${progressPercentage}%`}
                </span>
              </div>
              <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: loadingProgress ? '0%' : `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Action */}
            <div className="mt-4">
              <Link href={`/student/courses/${enrollment.course_id}`}>
                <Button variant="primary" size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  {isCompleted ? 'Review Course' : 'Continue Learning'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
