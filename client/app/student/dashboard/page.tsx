'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Trophy, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import * as enrollmentsApi from '@/lib/api/enrollments';
import type { EnrollmentWithCourse } from '@/lib/types';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

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

  const stats = [
    { 
      label: 'Enrolled Courses', 
      value: enrollments.length, 
      icon: BookOpen,
      color: 'text-blue-500'
    },
    { 
      label: 'In Progress', 
      value: enrollments.filter(e => e.status === 'active').length, 
      icon: Clock,
      color: 'text-yellow-500'
    },
    { 
      label: 'Completed', 
      value: enrollments.filter(e => e.status === 'completed').length, 
      icon: Trophy,
      color: 'text-green-500'
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="mb-2 text-2xl font-display font-bold text-text-primary">
          Student Dashboard
        </h1>
        <p className="max-w-3xl text-text-secondary">
          Track your learning progress and continue where you left off.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-[18px] border border-[#1E1E1E] bg-[#111111] p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm text-text-secondary">{stat.label}</p>
                  <p className="mt-3 text-3xl font-display font-bold tabular-nums text-text-primary">
                    {loading ? '-' : stat.value}
                  </p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-bg-elevated ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-display font-semibold text-text-primary">
            Continue Learning
          </h2>
          <Link href="/student/enrolled">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-32 rounded-t-lg" />
                <CardContent className="pt-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-text-muted" />
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                No courses yet
              </h3>
              <p className="mb-4 text-text-secondary">
                Start your learning journey by exploring our course catalog.
              </p>
              <Link href="/student/courses">
                <Button variant="primary">Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.slice(0, 3).map((enrollment) => (
              <div
                key={enrollment._id}
                className="overflow-hidden rounded-[18px] border border-[#1E1E1E] bg-[#111111] p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex h-36 items-center justify-center rounded-[14px] border border-[#2A1C14] bg-[#3A1A0D]">
                  <BookOpen className="h-12 w-12 text-accent" />
                </div>
                <div className="pt-4">
                  <Badge variant={enrollment.status === 'completed' ? 'success' : 'info'} className="mb-2 uppercase">
                    {enrollment.status}
                  </Badge>
                  <h3 className="mb-1 truncate font-semibold text-text-primary">
                    {enrollment.course?.title || `Course #${enrollment.course_id.slice(-6)}`}
                  </h3>
                  <p className="mb-4 text-sm text-text-secondary">
                    Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </p>
                  <Link href={`/student/courses/${enrollment.course_id}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Continue Learning
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-display font-semibold text-text-primary">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/student/courses">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-accent" />
                <p className="font-medium text-text-primary">Browse Courses</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/student/enrolled">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
                <p className="font-medium text-text-primary">My Learning</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/student/profile">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <Trophy className="mx-auto mb-2 h-8 w-8 text-green-500" />
                <p className="font-medium text-text-primary">Certificates</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/#contact">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <ArrowRight className="mx-auto mb-2 h-8 w-8 text-blue-500" />
                <p className="font-medium text-text-primary">Get Help</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
