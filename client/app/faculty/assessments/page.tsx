'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Edit,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import * as coursesApi from '@/lib/api/courses';
import type { Course } from '@/lib/types';

export default function FacultyAssessmentsOverviewPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await coursesApi.getMyCourses();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses for assessments:', error);
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-[#1E1E1E] bg-[radial-gradient(circle_at_top_left,rgba(255,92,0,0.18),transparent_30%),linear-gradient(180deg,#101214_0%,#0B0D10_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-[#FF6A2A]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Assessment Overview
            </p>
            <h1
              className="mt-4 text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Launch and manage course exams from one surface
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8E98A4]">
              Exams are created per course. Choose a course below to create final or
              module assessments, then jump straight into the authoring workspace.
            </p>
          </div>
          <Link href="/faculty/courses/new">
            <Button variant="secondary" size="lg" className="rounded-[16px]">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Button>
          </Link>
        </div>
      </section>

      <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
        <CardContent className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-3">
          <div className="rounded-lg bg-bg-elevated p-4">
            <p className="text-sm text-text-secondary">Courses</p>
            <p className="mt-1 text-3xl font-display font-bold text-text-primary">
              {loading ? '-' : courses.length}
            </p>
          </div>
          <div className="rounded-lg bg-bg-elevated p-4">
            <p className="text-sm text-text-secondary">Published</p>
            <p className="mt-1 text-3xl font-display font-bold text-green-500">
              {loading
                ? '-'
                : courses.filter((course) => course.status === 'published').length}
            </p>
          </div>
          <div className="rounded-lg bg-bg-elevated p-4">
            <p className="text-sm text-text-secondary">Draft</p>
            <p className="mt-1 text-3xl font-display font-bold text-yellow-500">
              {loading
                ? '-'
                : courses.filter((course) => course.status === 'draft').length}
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 text-text-muted" />
            <h2 className="text-lg font-semibold text-text-primary">
              Create a course before adding exams
            </h2>
            <p className="mt-2 text-text-secondary">
              Faculty assessments are attached to a course, so the first step is
              creating a course and at least one module.
            </p>
            <Link href="/faculty/courses/new" className="mt-6 inline-flex">
              <Button variant="primary">Create Course</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {courses.map((course) => (
            <Card
              key={course._id}
              className="transition-colors hover:border-accent/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="line-clamp-1 text-lg">
                      {course.title}
                    </CardTitle>
                    <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
                      {course.description}
                    </p>
                  </div>
                  <Badge
                    variant={course.status === 'published' ? 'success' : 'default'}
                    className="shrink-0"
                  >
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-bg-elevated p-3">
                    <p className="text-text-muted">Modules</p>
                    <p className="mt-1 font-semibold text-text-primary">
                      {course.total_modules}
                    </p>
                  </div>
                  <div className="rounded-lg bg-bg-elevated p-3">
                    <p className="text-text-muted">Duration</p>
                    <p className="mt-1 font-semibold text-text-primary">
                      {course.total_duration} min
                    </p>
                  </div>
                  <div className="rounded-lg bg-bg-elevated p-3">
                    <p className="text-text-muted">Price</p>
                    <p className="mt-1 font-semibold text-text-primary">
                      {course.price === 0 ? 'Free' : `₹${course.price.toLocaleString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/faculty/courses/${course._id}/assessments`}
                    className="flex-1"
                  >
                    <Button variant="primary" className="w-full">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Create Exam
                    </Button>
                  </Link>
                  <Link href={`/faculty/courses/${course._id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Open Course
                    </Button>
                  </Link>
                </div>

                <Link
                  href={`/faculty/courses/${course._id}/assessments`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80"
                >
                  Manage this course's assessments
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-text-primary">
              How assessment visibility works right now
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Students only see an exam after faculty creates it, and backend access is
              currently based on course enrollment. Per-student assignment is not yet
              supported by the backend.
            </p>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">Course-linked assessment flow</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
