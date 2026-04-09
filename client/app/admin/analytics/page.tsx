'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, CheckCircle2, ClipboardList, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { loadAdminOverview, type AdminCourseInsight } from '@/lib/admin/overview';
import type { User } from '@/lib/types';

interface FacultyRollup {
  userId: string;
  name: string;
  courses: number;
  publishedCourses: number;
  learners: number;
}

export default function AdminAnalytics() {
  const [courses, setCourses] = useState<AdminCourseInsight[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadAdminOverview();
        setCourses(data.courses);
        setUsers(data.users);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const facultyRollup = useMemo<FacultyRollup[]>(() => {
    const facultyUsers = users.filter((user) => user.role === 'faculty');

    return facultyUsers
      .map((faculty) => {
        const facultyCourses = courses.filter(
          (item) => item.course.faculty_id === faculty._id
        );

        return {
          userId: faculty._id,
          name: faculty.name,
          courses: facultyCourses.length,
          publishedCourses: facultyCourses.filter(
            (item) => item.course.status === 'published'
          ).length,
          learners: facultyCourses.reduce(
            (sum, item) => sum + item.enrolledStudents,
            0
          ),
        };
      })
      .filter((item) => item.courses > 0)
      .sort((left, right) => right.learners - left.learners);
  }, [courses, users]);

  const totals = useMemo(() => {
    const totalStudents = courses.reduce(
      (sum, item) => sum + item.enrolledStudents,
      0
    );
    const totalAttempts = courses.reduce(
      (sum, item) => sum + item.totalAttempts,
      0
    );
    const totalProgressRecords = courses.reduce(
      (sum, item) => sum + item.totalProgressRecords,
      0
    );

    return {
      totalUsers: users.length,
      publishedCourses: courses.filter((item) => item.course.status === 'published')
        .length,
      totalStudents,
      totalAttempts,
      totalProgressRecords,
    };
  }, [courses, users]);

  const topEnrollmentCourses = useMemo(() => {
    return [...courses]
      .sort((left, right) => right.enrolledStudents - left.enrolledStudents)
      .slice(0, 5);
  }, [courses]);

  const topAttemptCourses = useMemo(() => {
    return [...courses]
      .sort((left, right) => right.totalAttempts - left.totalAttempts)
      .slice(0, 5);
  }, [courses]);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary">
          Platform-wide visibility into users, course uptake, and assessment activity.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-500/30">
          <CardContent className="py-4 text-sm text-red-400">{error}</CardContent>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: 'Users',
            value: totals.totalUsers,
            icon: Users,
            color: 'text-blue-500',
          },
          {
            label: 'Published Courses',
            value: totals.publishedCourses,
            icon: BookOpen,
            color: 'text-green-500',
          },
          {
            label: 'Tracked Learners',
            value: totals.totalStudents,
            icon: BarChart3,
            color: 'text-accent',
          },
          {
            label: 'Assessment Attempts',
            value: totals.totalAttempts,
            icon: ClipboardList,
            color: 'text-orange-500',
          },
          {
            label: 'Progress Records',
            value: totals.totalProgressRecords,
            icon: CheckCircle2,
            color: 'text-purple-500',
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-text-primary">
                      {loading ? '-' : item.value}
                    </p>
                  </div>
                  <div className={`rounded-lg bg-bg-elevated p-3 ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Courses by Enrollment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-text-secondary">Loading leaderboard...</p>
            ) : topEnrollmentCourses.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Enrollment analytics will appear here once courses have learners.
              </p>
            ) : (
              topEnrollmentCourses.map((item, index) => (
                <div
                  key={item.course._id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">
                        {index + 1}. {item.course.title}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {item.totalLessons} lessons • {item.course.total_duration} min
                      </p>
                    </div>
                    <Badge variant="info">{item.enrolledStudents} learners</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>{item.totalProgressRecords} progress records</span>
                    <span>{item.totalAttempts} assessment attempts</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Courses by Attempts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-text-secondary">Loading attempt data...</p>
            ) : topAttemptCourses.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Assessment attempts will appear here once students submit exams.
              </p>
            ) : (
              topAttemptCourses.map((item, index) => (
                <div
                  key={item.course._id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">
                        {index + 1}. {item.course.title}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {item.totalProgressRecords} lesson completions recorded
                      </p>
                    </div>
                    <Badge variant="warning">{item.totalAttempts} attempts</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>{item.enrolledStudents} learners</span>
                    <span>{item.totalProgressRecords} progress records</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faculty Reach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-text-secondary">Loading faculty data...</p>
            ) : facultyRollup.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Faculty analytics will populate once instructors create courses.
              </p>
            ) : (
              facultyRollup.map((faculty) => (
                <div
                  key={faculty.userId}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium text-text-primary">{faculty.name}</p>
                    <Badge variant="info">{faculty.learners} learners</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <span>{faculty.courses} courses</span>
                    <span>{faculty.publishedCourses} published</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-text-secondary">Loading engagement data...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Engagement metrics will appear here once course data is available.
              </p>
            ) : (
              courses.slice(0, 6).map((item) => (
                <div
                  key={item.course._id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium text-text-primary">
                      {item.course.title}
                    </p>
                    <Badge
                      variant={
                        item.course.status === 'published' ? 'success' : 'warning'
                      }
                    >
                      {item.course.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <span>{item.enrolledStudents} learners</span>
                    <span>{item.totalProgressRecords} completions</span>
                    <span>{item.totalAttempts} attempts</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
