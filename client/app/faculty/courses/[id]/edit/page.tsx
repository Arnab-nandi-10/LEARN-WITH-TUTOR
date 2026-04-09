'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import CourseForm from '@/client/components/faculty/CourseForm';
import { toast } from 'sonner';
import * as coursesApi from '@/lib/api/courses';
import type { Course } from '@/lib/types';

export default function CourseEditPage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await coursesApi.getFullCourse(courseId);
        setCourse(data.course);
      } catch (error) {
        console.error('Failed to fetch course:', error);
        toast.error('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Course not found
          </h3>
          <Link href="/faculty/courses">
            <Button variant="primary">Back to Courses</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href={`/faculty/courses/${courseId}`}
        className="inline-flex items-center text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Course
      </Link>

      {/* Form */}
      <CourseForm initialData={course} isNewCourse={false} />
    </div>
  );
}
