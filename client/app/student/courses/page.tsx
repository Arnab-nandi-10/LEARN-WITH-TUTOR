'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Layers3,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import * as coursesApi from '@/lib/api/courses';
import type { Course } from '@/lib/types';
import { cn } from '@/lib/utils';

const getCourseTag = (course: Course) => {
  if (course.price === 0) return 'Free Track';
  if (course.total_modules >= 14) return 'Flagship';
  if (course.total_modules >= 10) return 'Trending';
  return 'Fresh Drop';
};

const getCourseLevel = (course: Course) => {
  if (course.total_modules >= 14) return 'Advanced';
  if (course.total_modules >= 8) return 'Intermediate';
  return 'Beginner';
};

const getDurationLabel = (course: Course) => {
  if (course.total_duration >= 60) {
    return `${Math.max(1, Math.round(course.total_duration / 60))} Hours`;
  }

  if (course.total_duration > 0) {
    return `${course.total_duration} Minutes`;
  }

  return `${Math.max(course.total_modules, 1)} Module Flow`;
};

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await coursesApi.getAllCourses();
        setCourses(data.filter((course) => course.status === 'published'));
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(courses.map((course) => course.category)))],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === 'all' || course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

  const stats = useMemo(() => {
    return {
      liveCourses: courses.length,
      freeCourses: courses.filter((course) => course.price === 0).length,
      premiumCourses: courses.filter((course) => course.price > 0).length,
      categories: Math.max(categories.length - 1, 0),
    };
  }, [categories.length, courses]);

  const hasCatalogCourses = courses.length > 0;
  const hasFilteredCourses = filteredCourses.length > 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[34px] border border-[#1C1C1F] bg-[radial-gradient(circle_at_top,rgba(255,92,0,0.18),transparent_36%),linear-gradient(180deg,#101012_0%,#0B0B0C_100%)] p-6 sm:p-8">
        <div className="absolute inset-0 line-grid opacity-20" />
        <div className="relative z-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_360px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2B211C] bg-[#18110D] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#FF8A4C]">
                <Sparkles className="h-3.5 w-3.5" />
                Student Catalog
              </div>
              <h1
                className="max-w-4xl text-3xl font-semibold leading-tight text-[#FAFAFA] sm:text-5xl"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Discover live programs that are ready to learn right now.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9A9A9E] sm:text-base">
                Browse approved learning paths, compare intensity at a glance, and jump
                straight into a course page that feels closer to a premium SaaS product
                than a basic catalog.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <CatalogStat
                  label="Live courses"
                  value={loading ? '—' : String(stats.liveCourses)}
                />
                <CatalogStat
                  label="Free tracks"
                  value={loading ? '—' : String(stats.freeCourses)}
                />
                <CatalogStat
                  label="Premium paths"
                  value={loading ? '—' : String(stats.premiumCourses)}
                />
                <CatalogStat
                  label="Categories"
                  value={loading ? '—' : String(stats.categories)}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-[#1E1E22] bg-[#111214]/90 p-5">
              <label
                htmlFor="course-search"
                className="mb-3 block text-[11px] uppercase tracking-[0.18em] text-[#6E6E73]"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                Search Catalog
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66666B]" />
                <input
                  id="course-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search title, category, or topic..."
                  className="w-full rounded-[18px] border border-[#202125] bg-[#0A0B0D] py-3 pl-11 pr-4 text-sm text-[#FAFAFA] placeholder:text-[#58585D] focus:border-[#FF5C00] focus:outline-none"
                />
              </div>
              <div className="mt-4 rounded-[18px] border border-[#1C1D21] bg-[#0C0D10] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#66666B]">
                  Current View
                </p>
                <p className="mt-2 text-sm text-[#D8D8DC]">
                  {loading
                    ? 'Loading live inventory...'
                    : `${filteredCourses.length} courses match your current search and category.`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm transition-colors',
                  selectedCategory === category
                    ? 'border-[#FF5C00] bg-[#FF5C00] text-white'
                    : 'border-[#212226] bg-[#111214] text-[#9A9A9E] hover:border-[#32343A] hover:text-[#FAFAFA]'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-[28px] border border-[#1C1C1F] bg-[#111214] p-6"
            >
              <Skeleton className="mb-5 h-44 rounded-[20px] bg-[#191A1F]" />
              <Skeleton className="mb-3 h-5 w-28 rounded-full bg-[#191A1F]" />
              <Skeleton className="mb-3 h-7 w-3/4 rounded-sm bg-[#191A1F]" />
              <Skeleton className="mb-2 h-4 w-full rounded-sm bg-[#191A1F]" />
              <Skeleton className="mb-6 h-4 w-5/6 rounded-sm bg-[#191A1F]" />
              <Skeleton className="h-12 rounded-[16px] bg-[#191A1F]" />
            </div>
          ))}
        </div>
      ) : !hasCatalogCourses ? (
        <CatalogEmptyState
          title="No live courses yet"
          description="Published courses will appear here once they are available in the student catalog. Legacy published courses are also supported, so after a refresh you should see anything that is live and not explicitly rejected."
          actionLabel="Refresh catalog"
          onAction={() => window.location.reload()}
        />
      ) : !hasFilteredCourses ? (
        <CatalogEmptyState
          title="No matching courses"
          description="Your catalog has live courses, but nothing matches the current search or selected category. Try a broader keyword or switch back to all categories."
          actionLabel="Clear filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedCategory('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CatalogCourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#1D1E22] bg-[#101114]/80 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#66666B]">
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold text-[#FAFAFA]"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        {value}
      </p>
    </div>
  );
}

function CatalogEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[30px] border border-dashed border-[#232428] bg-[#101113] px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#232428] bg-[#15161A]">
        <BookOpen className="h-7 w-7 text-[#7B7B82]" />
      </div>
      <h3
        className="text-2xl font-semibold text-[#FAFAFA]"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#8D8D93]">
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 rounded-[16px] bg-[#FF5C00] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF7A2D]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function CatalogCourseCard({ course }: { course: Course }) {
  return (
    <div className="group overflow-hidden rounded-[30px] border border-[#1D1E22] bg-[#101114] transition-all duration-300 hover:-translate-y-1 hover:border-[#32343A]">
      <div className="relative overflow-hidden border-b border-[#1C1D21] bg-[radial-gradient(circle_at_top_left,rgba(255,92,0,0.25),transparent_42%),linear-gradient(135deg,#141518,#0E0F11)] p-5">
        {course.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-48 w-full rounded-[22px] object-cover"
          />
        ) : (
          <div className="flex h-48 items-end rounded-[22px] border border-[#24262B] bg-[radial-gradient(circle_at_top_left,rgba(255,92,0,0.22),transparent_40%),linear-gradient(135deg,#17191D,#0F1013)] p-5">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-[#3A2A22] bg-[#1A120E] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#FF8B50]">
                {course.category}
              </div>
              <p
                className="max-w-[220px] text-2xl font-semibold text-[#FAFAFA]"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {course.title}
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute right-7 top-7 rounded-full border border-[#2C2E34] bg-black/30 p-2 text-[#FF8B50] opacity-70 transition-opacity group-hover:opacity-100">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#322018] bg-[#1A120D] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#FF8B50]">
            {getCourseTag(course)}
          </span>
          <span className="rounded-full border border-[#202126] bg-[#131418] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#8F8F95]">
            {getCourseLevel(course)}
          </span>
        </div>

        <div>
          <h3
            className="text-xl font-semibold leading-snug text-[#FAFAFA]"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {course.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#8D8D93]">
            {course.description}
          </p>
        </div>

        <div className="grid gap-3 rounded-[22px] border border-[#1D1F24] bg-[#0D0E11] p-4 sm:grid-cols-2">
          <MetaPill
            icon={<Clock3 className="h-4 w-4 text-[#FF8B50]" />}
            label={getDurationLabel(course)}
          />
          <MetaPill
            icon={<Layers3 className="h-4 w-4 text-[#FF8B50]" />}
            label={`${course.total_modules} modules`}
          />
          <MetaPill
            icon={<TrendingUp className="h-4 w-4 text-[#FF8B50]" />}
            label={course.price === 0 ? 'Start free' : 'Premium path'}
          />
          <MetaPill
            icon={<Sparkles className="h-4 w-4 text-[#FF8B50]" />}
            label={course.category}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#66666B]">
              Price
            </p>
            <p
              className="mt-1 text-2xl font-semibold text-[#FAFAFA]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {course.price === 0 ? 'Free' : `₹${course.price.toLocaleString()}`}
            </p>
          </div>

          <Link href={`/student/courses/${course._id}`}>
            <button className="inline-flex items-center gap-2 rounded-[16px] bg-[#FF5C00] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF7A2D]">
              View course
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetaPill({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[16px] border border-[#17181C] bg-[#121318] px-3 py-3 text-sm text-[#C8C8CE]">
      {icon}
      <span>{label}</span>
    </div>
  );
}
