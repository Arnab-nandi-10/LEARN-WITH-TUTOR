'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Trophy, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/stores/authStore';
import * as enrollmentsApi from '@/lib/api/enrollments';
import type { EnrollmentWithCourse } from '@/lib/types';

export default function StudentDashboard() {
  const { user } = useAuth();
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
          Student Dashboard
        </h1>
        <p className="text-text-secondary">
          Track your learning progress and continue where you left off.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div className={`p-3 bg-bg-elevated rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Continue Learning */}
      <div>
        <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No courses yet
              </h3>
              <p className="text-text-secondary mb-4">
                Start your learning journey by exploring our course catalog.
              </p>
              <Link href="/student/courses">
                <Button variant="primary">Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.slice(0, 3).map((enrollment) => (
              <Card key={enrollment._id} className="hover:border-accent/50 transition-colors">
                <div className="h-32 bg-gradient-to-br from-accent/20 to-accent/5 rounded-t-lg flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-accent" />
                </div>
                <CardContent className="pt-4">
                  <Badge variant={enrollment.status === 'completed' ? 'success' : 'info'} className="mb-2">
                    {enrollment.status}
                  </Badge>
                  <h3 className="font-semibold text-text-primary mb-1">
                    {enrollment.course?.title || `Course #${enrollment.course_id.slice(-6)}`}
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </p>
                  <Link href={`/student/courses/${enrollment.course_id}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Continue Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/student/courses">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <BookOpen className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="font-medium text-text-primary">Browse Courses</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/student/enrolled">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-medium text-text-primary">My Learning</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/student/profile">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-text-primary">Certificates</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/#contact">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <ArrowRight className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium text-text-primary">Get Help</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
