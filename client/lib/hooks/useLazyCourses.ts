import { useState, useEffect, useCallback } from 'react';
import { Course } from '@/lib/types';
import * as coursesApi from '@/lib/api/courses';

interface UseLazyCoursesProps {
  initialLimit?: number;
}

/**
 * Hook for lazy loading courses with pagination
 * Loads more courses as user scrolls
 */
export const useLazyCourses = ({ initialLimit = 10 }: UseLazyCoursesProps = {}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load more courses
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await coursesApi.getAllCourses(page, initialLimit);

      // Response is a direct array of courses
      if (Array.isArray(response)) {
        setCourses((prev) => [...prev, ...response]);
        setPage((prev) => prev + 1);
        // If we got fewer courses than the limit, there are no more
        setHasMore(response.length === initialLimit);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, initialLimit]);

  // Load initial courses
  useEffect(() => {
    loadMore();
  }, []); // Only run once on mount

  return {
    courses,
    loading,
    hasMore,
    error,
    loadMore,
  };
};
