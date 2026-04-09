'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { Course } from '@/lib/types';
import { getMyCourses } from '@/lib/api/courses';
import { Plus, BookOpen, Users, Eye, Edit, Calendar, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function FacultyDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'faculty') {
      router.push('/login');
      return;
    }

    loadCourses();
  }, [isAuthenticated, user, router]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const facultyCourses = await getMyCourses();
      setCourses(facultyCourses);
    } catch (error: any) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'faculty') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const publishedCourses = courses.filter(course => course.status === 'published');
  const draftCourses = courses.filter(course => course.status === 'draft');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Faculty Dashboard</h1>
              <p className="text-gray-400 mt-1">Welcome back, {user.name}</p>
            </div>
            <Link
              href="/faculty/courses/new"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-600/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Courses</p>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-600/10 rounded-lg">
                <Eye className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Published</p>
                <p className="text-2xl font-bold text-white">{publishedCourses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-600/10 rounded-lg">
                <Edit className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Drafts</p>
                <p className="text-2xl font-bold text-white">{draftCourses.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">My Courses</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No courses yet</h3>
              <p className="text-gray-400 mb-6">Get started by creating your first course</p>
              <Link
                href="/faculty/courses/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden hover:border-gray-600 transition-colors"
                >
                  <div className="aspect-video bg-gray-700 relative">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.status === 'published'
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                            : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                        }`}
                      >
                        {course.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span className="inline-flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                      <span className="inline-flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex space-x-3">
                      <Link
                        href={`/faculty/courses/${course._id}/edit`}
                        className="flex-1 text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/faculty/courses/${course._id}/preview`}
                        className="flex-1 text-center py-2 px-3 border border-gray-600 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Preview
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}