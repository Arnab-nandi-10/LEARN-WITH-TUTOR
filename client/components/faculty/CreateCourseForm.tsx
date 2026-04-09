'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Upload, DollarSign, Tag, FileText } from 'lucide-react';
import { createCourse } from '@/lib/api/courses';
import Link from 'next/link';
import { toast } from 'sonner';

// Validation schema
const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number().min(0, 'Price cannot be negative'),
  thumbnail_url: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
});

type CourseFormData = z.infer<typeof courseSchema>;

const categories = [
  'Programming',
  'Web Development',
  'Data Science',
  'Machine Learning',
  'Mobile Development',
  'Game Development',
  'Design',
  'Business',
  'Marketing',
  'Other'
];

export default function CreateCourseForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      price: 0,
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    
    try {
      const courseData = {
        ...data,
        thumbnail_url: data.thumbnail_url || undefined,
      };
      
      const newCourse = await createCourse(courseData);
      
      toast.success('Course created successfully!');
      router.push(`/faculty/courses/${newCourse._id}/edit`);
    } catch (error: any) {
      console.error('Course creation failed:', error);
      toast.error(error.message || 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/faculty/dashboard"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">Create New Course</h1>
        <p className="text-gray-400 mt-2">
          Fill in the details below to create your course. You can add modules and lessons after creation.
        </p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Course Title *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="title"
                type="text"
                {...register('title')}
                className="appearance-none block w-full px-10 py-3 border border-gray-600 rounded-lg placeholder-gray-400 text-white bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Complete Web Development Bootcamp"
              />
            </div>
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Course Description *
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="appearance-none block w-full px-4 py-3 border border-gray-600 rounded-lg placeholder-gray-400 text-white bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe what students will learn in this course..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Category and Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="category"
                  {...register('category')}
                  className="appearance-none block w-full px-10 py-3 border border-gray-600 rounded-lg placeholder-gray-400 text-white bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                Price ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('price', {
                    setValueAs: (value) => (value === '' ? 0 : Number(value)),
                  })}
                  className="appearance-none block w-full px-10 py-3 border border-gray-600 rounded-lg placeholder-gray-400 text-white bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Set to 0 for free courses</p>
            </div>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-300 mb-2">
              Course Thumbnail URL (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="thumbnail_url"
                type="url"
                {...register('thumbnail_url')}
                className="appearance-none block w-full px-10 py-3 border border-gray-600 rounded-lg placeholder-gray-400 text-white bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {errors.thumbnail_url && (
              <p className="mt-1 text-sm text-red-400">{errors.thumbnail_url.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Recommended size: 1280x720px or 16:9 aspect ratio
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex justify-center items-center py-3 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Course...
                </>
              ) : (
                'Create Course'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 py-3 px-6 border border-gray-600 text-base font-medium rounded-lg text-gray-300 bg-transparent hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
