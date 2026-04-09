'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardList, Edit, Eye, EyeOff, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import * as coursesApi from '@/lib/api/courses';
import type { Course } from '@/lib/types';

export default function MyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await coursesApi.getMyCourses();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    if (filter === 'all') return true;
    return course.status === filter;
  });

  const stats = {
    total: courses.length,
    published: courses.filter((c) => c.status === 'published').length,
    draft: courses.filter((c) => c.status === 'draft').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
            My Courses
          </h1>
          <p className="text-text-secondary">
            Manage all your courses and content.
          </p>
        </div>
        <Link href="/faculty/courses/new">
          <Button variant="primary" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          className="cursor-pointer hover:border-accent/50 transition-colors"
          onClick={() => setFilter('all')}
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-text-primary">
              {stats.total}
            </p>
            <p className="text-sm text-text-secondary">Total Courses</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-accent/50 transition-colors"
          onClick={() => setFilter('published')}
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.published}
            </p>
            <p className="text-sm text-text-secondary">Published</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-accent/50 transition-colors"
          onClick={() => setFilter('draft')}
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.draft}</p>
            <p className="text-sm text-text-secondary">Draft</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === 'all' ? 'All' : f}
          </Button>
        ))}
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-40 h-28 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {filter === 'all' ? 'No courses yet' : `No ${filter} courses`}
            </h3>
            <p className="text-text-secondary mb-4">
              {filter === 'all'
                ? 'Create your first course to get started.'
                : `You don't have any ${filter} courses yet.`}
            </p>
            {filter === 'all' && (
              <Link href="/faculty/courses/new">
                <Button variant="primary">Create Course</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="hover:border-accent/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Thumbnail */}
          <div className="w-full sm:w-40 h-28 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-12 h-12 text-accent" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-text-primary">
                  {course.title}
                </h3>
                <Badge
                  variant={
                    course.status === 'published' ? 'success' : 'default'
                  }
                  className="mt-1"
                >
                  {course.status === 'published' ? (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Published
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Draft
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-text-secondary line-clamp-2 mb-3">
              {course.description}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between text-sm text-text-muted mb-4">
              <span>{course.total_modules} modules</span>
              <span>{course.total_duration} min</span>
              <span className="font-semibold">
                {course.price === 0 ? 'Free' : `₹${course.price.toLocaleString()}`}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/faculty/courses/${course._id}`}>
                <Button variant="secondary" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </Link>
              <Link href={`/faculty/courses/${course._id}/assessments`}>
                <Button variant="primary" size="sm">
                  <ClipboardList className="w-4 h-4 mr-1" />
                  Create Exam
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
