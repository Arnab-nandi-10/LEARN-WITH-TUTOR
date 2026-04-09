'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  hasCachedStudentActivity,
  loadFacultyCourseAnalytics,
  type CourseAnalyticsSummary,
} from '@/lib/analytics/faculty';

const formatActivityDate = (value: string | null): string => {
  if (!value) return 'No recent activity';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No recent activity';

  return `Updated ${parsed.toLocaleDateString()}`;
};

export default function FacultyAnalytics() {
  const [analytics, setAnalytics] = useState<CourseAnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await loadFacultyCourseAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const totalCourses = analytics.length;
  const publishedCourses = analytics.filter(
    (item) => item.course.status === 'published'
  ).length;
  const totalStudents = analytics.reduce(
    (sum, item) => sum + item.enrolledStudents,
    0
  );
  const totalHours = Math.round(
    analytics.reduce((sum, item) => sum + item.course.total_duration, 0) / 60
  );
  const averageCompletion =
    analytics.reduce((sum, item) => sum + item.trackedStudents, 0) > 0
      ? Math.round(
          analytics.reduce(
            (sum, item) => sum + item.averageCompletion * item.trackedStudents,
            0
          ) /
            analytics.reduce((sum, item) => sum + item.trackedStudents, 0)
        )
      : 0;
  const completedStudents = analytics.reduce(
    (sum, item) => sum + item.completedStudents,
    0
  );
  const showCacheHint =
    !loading && totalCourses > 0 && totalStudents === 0 && !hasCachedStudentActivity();

  const stats = [
    {
      label: 'Total Courses',
      value: totalCourses,
      icon: BookOpen,
      color: 'text-blue-500',
    },
    {
      label: 'Published',
      value: publishedCourses,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: 'Total Students',
      value: totalStudents,
      icon: Users,
      color: 'text-purple-500',
    },
    {
      label: 'Avg Completion',
      value: `${averageCompletion}%`,
      icon: CheckCircle2,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
          Analytics
        </h1>
        <p className="text-text-secondary">
          Student progress, completion, and course engagement for your faculty courses.
        </p>
      </div>

      {showCacheHint && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">
              Student progress is connected to the backend now. Analytics will appear
              here once students enroll and start working through your course content.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                    <p className="text-3xl font-display font-bold text-text-primary">
                      {loading ? '-' : stat.value}
                    </p>
                  </div>
                  <div className={`rounded-lg bg-bg-elevated p-3 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-semibold text-text-primary">
              Course Performance
            </h2>
            <p className="text-sm text-text-secondary">
              Average completion and learner progress per course.
            </p>
          </div>
          <div className="text-right text-sm text-text-muted">
            <p>{completedStudents} students completed courses</p>
            <p>{totalHours} hours of content tracked</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <Card key={item}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">
                No courses yet. Create a course to start tracking student progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {analytics.map((item) => (
              <Card key={item.course._id}>
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {item.course.title}
                        </h3>
                        <Badge
                          variant={
                            item.course.status === 'published' ? 'success' : 'default'
                          }
                        >
                          {item.course.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-text-muted">
                        {item.course.total_modules} modules • {item.totalLessons} lessons •{' '}
                        {item.course.total_duration} min
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:min-w-[360px]">
                      <div className="rounded-lg bg-bg-elevated p-3">
                        <p className="text-text-muted">Students</p>
                        <p className="mt-1 text-lg font-bold text-text-primary">
                          {item.enrolledStudents}
                        </p>
                      </div>
                      <div className="rounded-lg bg-bg-elevated p-3">
                        <p className="text-text-muted">Completed</p>
                        <p className="mt-1 text-lg font-bold text-green-500">
                          {item.completedStudents}
                        </p>
                      </div>
                      <div className="rounded-lg bg-bg-elevated p-3">
                        <p className="text-text-muted">Active</p>
                        <p className="mt-1 text-lg font-bold text-blue-500">
                          {item.activeStudents}
                        </p>
                      </div>
                      <div className="rounded-lg bg-bg-elevated p-3">
                        <p className="text-text-muted">Attempts</p>
                        <p className="mt-1 text-lg font-bold text-accent">
                          {item.totalAttempts}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Tracked average completion</span>
                      <span className="font-medium text-text-primary">
                        {item.averageCompletion}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${item.averageCompletion}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-medium text-text-primary">
                        Student Progress
                      </h4>
                      <p className="text-xs text-text-muted">
                        {item.trackedStudents > 0
                          ? `${item.trackedStudents} tracked of ${item.enrolledStudents} learners`
                          : item.enrolledStudents > 0
                            ? `${item.enrolledStudents} enrolled learners`
                            : 'No learners yet'}
                      </p>
                    </div>

                    {item.totalProgressRecords > 0 && (
                      <p className="mb-3 text-xs text-text-muted">
                        Backend has recorded {item.totalProgressRecords} total lesson completions for this course.
                      </p>
                    )}

                    {item.studentProgress.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">
                        {item.enrolledStudents > 0
                          ? 'Enrollment totals are coming from the backend. Per-student progress rows will appear here once learners generate progress activity.'
                          : 'Student progress will appear here once learners enroll and complete lessons.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {item.studentProgress.slice(0, 6).map((student) => (
                          <div
                            key={`${item.course._id}-${student.userId}`}
                            className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-text-primary">
                                {student.name}
                              </p>
                              <p className="truncate text-sm text-text-muted">
                                {student.email || `User ID: ${student.userId}`}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:min-w-[260px]">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-text-secondary">
                                  {student.completedLessons}/{student.totalLessons || 0}{' '}
                                  lessons
                                </span>
                                <span className="font-semibold text-text-primary">
                                  {student.progressPercentage}%
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                                <div
                                  className="h-full rounded-full bg-accent transition-all"
                                  style={{
                                    width: `${student.progressPercentage}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <Badge
                                  variant={
                                    student.enrollmentStatus === 'completed'
                                      ? 'success'
                                      : 'info'
                                  }
                                >
                                  {student.enrollmentStatus === 'completed'
                                    ? 'completed'
                                    : 'in progress'}
                                </Badge>
                                <span className="text-xs text-text-muted">
                                  {formatActivityDate(student.lastActivityAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-display font-semibold text-text-primary">
          Insights
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-accent" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-text-secondary">
              {totalStudents > 0 ? (
                <p>
                  You are tracking <span className="text-text-primary font-semibold">{totalStudents}</span>{' '}
                  students across <span className="text-text-primary font-semibold">{publishedCourses}</span>{' '}
                  published courses, with a tracked average completion of{' '}
                  <span className="text-accent font-semibold">{averageCompletion}%</span>.
                </p>
              ) : (
                <p>
                  Your faculty analytics are ready. Once students start learning, their
                  progress will be summarized here automatically.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-accent" />
                Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-text-secondary">
              <p>
                {totalHours} hours of course content and {analytics.reduce((sum, item) => sum + item.totalLessons, 0)} total lessons
                {' '}are included in these progress calculations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
