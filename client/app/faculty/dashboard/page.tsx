'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Users,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/stores/authStore';
import * as coursesApi from '@/lib/api/courses';
import type { Course } from '@/lib/types';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await coursesApi.getMyCourses();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const stats = [
    {
      label: 'Total Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'text-blue-500',
    },
    {
      label: 'Published',
      value: courses.filter(c => c.status === 'published').length,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: 'Draft',
      value: courses.filter(c => c.status === 'draft').length,
      icon: BarChart3,
      color: 'text-yellow-500',
    },
    {
      label: 'Total Modules',
      value: courses.reduce((sum, c) => sum + c.total_modules, 0),
      icon: Users,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
            Faculty Dashboard
          </h1>
          <p className="text-text-secondary">
            Manage your courses and track student engagement.
          </p>
        </div>
        <Link href="/faculty/courses/new">
          <Button variant="primary" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-display font-bold text-text-primary">
                      {loading ? '-' : stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 bg-bg-elevated rounded-lg ${stat.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-text-primary">
            Your Courses
          </h2>
          <Link href="/faculty/courses">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-40 rounded-t-lg" />
                <CardContent className="pt-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No courses yet
              </h3>
              <p className="text-text-secondary mb-4">
                Start creating courses to engage with students.
              </p>
              <Link href="/faculty/courses/new">
                <Button variant="primary">Create First Course</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((course) => (
              <Card
                key={course._id}
                className="hover:border-accent/50 transition-colors"
              >
                <div className="h-32 bg-gradient-to-br from-accent/20 to-accent/5 rounded-t-lg flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-accent" />
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-text-primary line-clamp-1">
                      {course.title}
                    </h3>
                    <Badge
                      variant={
                        course.status === 'published' ? 'success' : 'default'
                      }
                    >
                      {course.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-text-muted mb-4">
                    <span>{course.total_modules} modules</span>
                    <span>{course.total_duration} min</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link href={`/faculty/courses/${course._id}`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        Edit Course
                      </Button>
                    </Link>
                    <Link href={`/faculty/courses/${course._id}/assessments`}>
                      <Button variant="primary" size="sm" className="w-full">
                        Create Exam
                      </Button>
                    </Link>
                  </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/faculty/courses/new">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <Plus className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="font-medium text-text-primary">New Course</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/faculty/courses">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium text-text-primary">All Courses</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/faculty/assessments">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <ClipboardList className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="font-medium text-text-primary">Create Exam</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/faculty/analytics">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-text-primary">Analytics</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/faculty/profile">
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="font-medium text-text-primary">Profile</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
