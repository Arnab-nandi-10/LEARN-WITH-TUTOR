'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Clock3, Layers3, Sparkles } from 'lucide-react';
import { courseSchema, type CourseFormData } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';
import * as coursesApi from '@/lib/api/courses';
import type { Course } from '@/lib/types';

interface CourseFormProps {
  initialData?: Course;
  isNewCourse?: boolean;
}

const categoryOptions = [
  'Programming',
  'Web Development',
  'Data Science',
  'Machine Learning',
  'Mobile Development',
  'Game Development',
  'Design',
  'Business',
  'Marketing',
  'Other',
];

export default function CourseForm({ initialData, isNewCourse = true }: CourseFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          category: initialData.category,
          price: initialData.price,
          thumbnail_url: initialData.thumbnail_url,
        }
      : {
          title: '',
          description: '',
          category: '',
          price: 0,
        },
  });

  const onSubmit = async (data: CourseFormData) => {
    try {
      if (isNewCourse) {
        const createdCourse = await coursesApi.createCourse(data);
        toast.success('Course created successfully!');
        router.push(`/faculty/courses/${createdCourse._id}`);
        return;
      }

      if (initialData) {
        const updatedCourse = await coursesApi.updateCourse(initialData._id, data);
        toast.success('Course updated successfully!');
        router.push(`/faculty/courses/${updatedCourse._id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save course');
    }
  };

  const title = watch('title') || initialData?.title || 'Untitled Course';
  const description =
    watch('description') ||
    initialData?.description ||
    'Shape the promise of your course here. The preview updates live as you type.';
  const category = watch('category') || initialData?.category || 'Category';
  const price = watch('price') ?? initialData?.price ?? 0;
  const thumbnailUrl = watch('thumbnail_url') || initialData?.thumbnail_url || '';
  const moduleEstimate = Math.max(6, Math.ceil(title.trim().length / 5) || 6);
  const level =
    moduleEstimate >= 14 ? 'Advanced' : moduleEstimate >= 9 ? 'Intermediate' : 'Beginner';
  const durationLabel = `${Math.max(4, Math.ceil(moduleEstimate / 2))} Weeks`;
  const previewTag = isNewCourse ? 'Preview' : 'Live Edit';

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[30px] border border-[#1E1E1E] bg-[#101010] p-6 sm:p-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-[#FF5C00]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {isNewCourse ? 'Create Course' : 'Edit Course'}
            </p>
            <h1
              className="mt-3 text-3xl font-semibold text-[#FAFAFA]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {isNewCourse
                ? 'Build a course that already feels launch-ready.'
                : 'Refine the positioning, visuals, and pricing in one place.'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#888888]">
              Keep the same sharp visual language as your landing page while shaping the metadata
              students will see first in the catalog.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-[#888888] transition-colors hover:text-[#FAFAFA]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Input
                label="Course Title"
                placeholder="e.g., Full Stack Web Development"
                error={errors.title?.message}
                {...register('title')}
                disabled={isSubmitting}
                className="rounded-[16px] border-[#1E1E1E] bg-[#111111] px-4 py-3.5"
              />
            </div>

            <div className="lg:col-span-2">
              <Textarea
                label="Description"
                placeholder="Describe what students will learn and how the journey is structured..."
                error={errors.description?.message}
                {...register('description')}
                disabled={isSubmitting}
                rows={6}
                className="rounded-[16px] border-[#1E1E1E] bg-[#111111] px-4 py-3.5"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Category
              </label>
              <select
                {...register('category')}
                disabled={isSubmitting}
                className="w-full rounded-[16px] border border-[#1E1E1E] bg-[#111111] px-4 py-3.5 text-sm text-[#FAFAFA] focus:border-[#FF5C00] focus:outline-none"
              >
                <option value="">Select a category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.category?.message ? (
                <p className="mt-1.5 text-sm text-red-500">{errors.category.message}</p>
              ) : null}
            </div>

            <div>
              <Input
                label="Price (₹)"
                type="number"
                placeholder="0 for free course"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="rounded-[16px] border-[#1E1E1E] bg-[#111111] px-4 py-3.5"
              />
            </div>

            <div className="lg:col-span-2">
              <Input
                label="Thumbnail URL"
                type="url"
                placeholder="https://example.com/image.jpg"
                error={errors.thumbnail_url?.message}
                helperText="Optional: add a 16:9 cover image for richer presentation."
                {...register('thumbnail_url')}
                disabled={isSubmitting}
                className="rounded-[16px] border-[#1E1E1E] bg-[#111111] px-4 py-3.5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#1E1E1E] pt-6 sm:flex-row">
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="sm:min-w-[180px]">
              {isNewCourse ? 'Create Course' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <div className="sticky top-24 space-y-6">
          <div className="rounded-[28px] border border-[#1E1E1E] bg-[#101010] p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#FF5C00]">
              <Sparkles className="h-3.5 w-3.5" />
              Live Catalog Preview
            </div>

            <div className="relative flex flex-col rounded-sm border border-[#1E1E1E] bg-[#111111] p-6">
              <div className="mb-5 flex items-center justify-between">
                <span
                  className="rounded-sm bg-[#FF5C00]/10 px-2.5 py-1 text-[10px] text-[#FF5C00]"
                  style={{ fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}
                >
                  {previewTag}
                </span>
                <ArrowUpRight className="h-4 w-4 text-[#333333]" />
              </div>

              {thumbnailUrl ? (
                <div
                  className="mb-4 h-32 rounded-sm border border-[#1E1E1E] bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(rgba(10,10,10,0.45), rgba(10,10,10,0.8)), url(${thumbnailUrl})`,
                  }}
                />
              ) : null}

              <h3
                className="mb-2 text-base font-semibold leading-snug text-[#FAFAFA]"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {title}
              </h3>

              <p className="mb-6 flex-1 text-sm leading-relaxed text-[#555555]">
                {description}
              </p>

              <div className="mb-5 flex flex-col gap-2 text-xs text-[#555555]">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>{durationLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers3 className="h-3.5 w-3.5" />
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>
                    {moduleEstimate} modules · {level}
                  </span>
                </div>
              </div>

              <div className="mb-4 h-px bg-[#1E1E1E]" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                    {category}
                  </p>
                  <span
                    className="text-lg font-bold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {price && price > 0 ? `₹${price.toLocaleString()}` : 'Free'}
                  </span>
                </div>
                <button
                  type="button"
                  className="h-8 rounded-sm bg-[#1E1E1E] px-4 text-xs text-[#888888]"
                  style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600 }}
                >
                  Enroll
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#1E1E1E] bg-[#101010] p-5">
            <p
              className="text-[11px] uppercase tracking-[0.16em] text-[#888888]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Optimization Notes
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[#888888]">
              <li>Lead with a clear title and outcome-driven description.</li>
              <li>Keep the category focused so the course lands in the right filter.</li>
              <li>Use a 16:9 thumbnail to make the catalog card feel premium.</li>
              <li>Keep the first two description lines strong because that is what students scan first.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
