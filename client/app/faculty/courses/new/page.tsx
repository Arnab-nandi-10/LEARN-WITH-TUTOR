import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CourseForm from '@/components/faculty/CourseForm';

export const metadata = {
  title: 'Create Course - Tutor Labs',
  description: 'Create a new course for your students',
};

export default function CreateCoursePage() {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/faculty/courses" className="inline-flex items-center text-text-secondary hover:text-text-primary">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Courses
      </Link>

      {/* Form */}
      <CourseForm isNewCourse={true} />
    </div>
  );
}
