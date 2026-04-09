'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as attemptsApi from '@/lib/api/attempts';
import * as coursesApi from '@/lib/api/courses';
import * as enrollmentsApi from '@/lib/api/enrollments';
import * as examsApi from '@/lib/api/exams';
import * as progressApi from '@/lib/api/progress';
import type { CourseExamSummary, Exam, FullCourse } from '@/lib/types';

const getTotalLessons = (courseData: FullCourse): number => {
  return courseData.modules.reduce(
    (sum, module) => sum + (module.lessons?.length || 0),
    0
  );
};

const getRequiredCompletionPercentage = (
  courseData: FullCourse,
  exam: Exam
): number => {
  const totalLessons = getTotalLessons(courseData);

  if (totalLessons === 0) {
    return 0;
  }

  if (!exam.module_id) {
    return 100;
  }

  const sortedModules = [...courseData.modules].sort(
    (left, right) => left.order - right.order
  );
  let lessonsUntilModule = 0;

  for (const module of sortedModules) {
    lessonsUntilModule += module.lessons?.length || 0;

    if (module._id === exam.module_id) {
      return Math.min(
        100,
        Math.round((lessonsUntilModule / totalLessons) * 100)
      );
    }
  }

  return 100;
};

const getExamLabel = (courseData: FullCourse, exam: Exam): string => {
  if (!exam.module_id) {
    return 'Final Course Assessment';
  }

  return (
    courseData.modules.find((module) => module._id === exam.module_id)?.title ||
    'Module Assessment'
  );
};

export const useCourseExamSummaries = (courseId: string) => {
  const [hasHydrated, setHasHydrated] = useState(false);
  const queryStaleTime = 60_000;

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const courseQuery = useQuery({
    queryKey: ['course', 'full', courseId],
    queryFn: () => coursesApi.getFullCourse(courseId),
    enabled: Boolean(courseId),
    staleTime: queryStaleTime,
  });

  const examsQuery = useQuery({
    queryKey: ['course', 'exams', courseId],
    queryFn: () => examsApi.getCourseExams(courseId),
    enabled: Boolean(courseId),
    staleTime: queryStaleTime,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments(),
    staleTime: queryStaleTime,
  });

  const isEnrolled = useMemo(() => {
    return (
      enrollmentsQuery.data?.some((enrollment) => enrollment.course_id === courseId) ||
      false
    );
  }, [courseId, enrollmentsQuery.data]);

  const progressQuery = useQuery({
    queryKey: ['progress', 'course', courseId],
    queryFn: () => progressApi.getCourseProgress(courseId),
    enabled: Boolean(courseId) && isEnrolled,
    staleTime: 30_000,
  });

  const summaries = useMemo<CourseExamSummary[]>(() => {
    if (!courseQuery.data || !examsQuery.data) {
      return [];
    }

    const currentCompletionPercentage = progressQuery.data?.percentage ?? 0;

    return examsQuery.data.map((exam) => {
      const requiredCompletionPercentage = getRequiredCompletionPercentage(
        courseQuery.data,
        exam
      );
      const cachedAttempt = hasHydrated
        ? attemptsApi.getCachedAttemptResult(exam._id)
        : null;
      const availability = cachedAttempt
        ? 'completed'
        : !isEnrolled
          ? 'locked'
          : currentCompletionPercentage >= requiredCompletionPercentage
            ? 'available'
            : 'locked';

      return {
        exam,
        label: getExamLabel(courseQuery.data, exam),
        availability,
        requiredCompletionPercentage,
        currentCompletionPercentage,
      };
    });
  }, [
    courseQuery.data,
    examsQuery.data,
    hasHydrated,
    isEnrolled,
    progressQuery.data,
  ]);

  return {
    courseData: courseQuery.data || null,
    exams: examsQuery.data || [],
    summaries,
    isEnrolled,
    progressSummary: progressQuery.data || null,
    isLoading:
      courseQuery.isLoading ||
      examsQuery.isLoading ||
      enrollmentsQuery.isLoading ||
      (isEnrolled && progressQuery.isLoading && !progressQuery.data),
    error:
      courseQuery.error ||
      examsQuery.error ||
      enrollmentsQuery.error ||
      null,
  };
};
