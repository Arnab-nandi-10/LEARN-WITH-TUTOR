import apiClient, { handleApiError } from './client';
import { getCachedFullCourse } from './courses';
import type { CourseProgressSummary, Progress, User } from '../types';

// ============================================================
// PROGRESS API SERVICES
// ============================================================

const PROGRESS_CACHE_KEY = 'tutor-progress-cache';
const AUTH_STORAGE_KEY = 'auth-storage';
const COURSE_PROGRESS_MEMORY_TTL_MS = 15_000;

type CachedUserSnapshot = Pick<User, '_id' | 'name' | 'email'>;

const courseProgressRequests = new Map<string, Promise<CourseProgressSummary>>();
const courseProgressSnapshots = new Map<
  string,
  { summary: CourseProgressSummary; updatedAt: number }
>();

export interface CachedProgressRecord extends Progress {
  user?: CachedUserSnapshot;
}

const canUseProgressCache = (): boolean => typeof window !== 'undefined';

const readCachedAuthUser = (): User | null => {
  if (!canUseProgressCache()) return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      state?: {
        user?: User | null;
      };
    };

    return parsed?.state?.user || null;
  } catch {
    return null;
  }
};

const getUserSnapshot = (): CachedUserSnapshot | undefined => {
  const user = readCachedAuthUser();
  if (!user) return undefined;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
};

const readCachedProgress = (): CachedProgressRecord[] => {
  if (!canUseProgressCache()) return [];

  try {
    const raw = localStorage.getItem(PROGRESS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CachedProgressRecord[]) : [];
  } catch {
    return [];
  }
};

const writeCachedProgress = (records: CachedProgressRecord[]): void => {
  if (!canUseProgressCache()) return;

  try {
    localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(records));
  } catch {
    // Ignore cache write failures and keep API flow working.
  }
};

const removeCachedCourseProgress = (userId: string, courseId: string): void => {
  writeCachedProgress(
    readCachedProgress().filter(
      (record) => !(record.user_id === userId && record.course_id === courseId)
    )
  );
};

const getProgressCacheId = (record: Partial<Progress>): string => {
  return (
    record._id ||
    `${record.user_id || 'unknown'}:${record.course_id || 'unknown'}:${record.lesson_id || 'unknown'}`
  );
};

const cacheProgressRecords = (records: Progress[]): void => {
  if (records.length === 0) return;

  const existing = readCachedProgress();
  const user = getUserSnapshot();
  const progressMap = new Map<string, CachedProgressRecord>();

  existing.forEach((record) => {
    progressMap.set(getProgressCacheId(record), record);
  });

  records.forEach((record) => {
    const cacheId = getProgressCacheId(record);
    const previous = progressMap.get(cacheId);

    progressMap.set(cacheId, {
      ...previous,
      ...record,
      user: user || previous?.user,
    });
  });

  writeCachedProgress(Array.from(progressMap.values()));
};

const getCachedOwnCourseProgress = (courseId: string): CachedProgressRecord[] => {
  const user = readCachedAuthUser();
  if (!user) return [];

  return readCachedProgress().filter(
    (record) => record.user_id === user._id && record.course_id === courseId
  );
};

export const getCachedProgressRecords = (): CachedProgressRecord[] => {
  return readCachedProgress();
};

const buildProgressSummary = (
  completed: number,
  total: number
): CourseProgressSummary => {
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

const getCachedCourseProgressSummary = (
  courseId: string
): CourseProgressSummary | null => {
  const cachedOwnProgress = getCachedOwnCourseProgress(courseId);
  const cachedFullCourse = getCachedFullCourse(courseId);
  const totalLessons =
    cachedFullCourse?.modules.reduce(
      (sum, module) => sum + (module.lessons?.length || 0),
      0
    ) || 0;

  if (cachedOwnProgress.length === 0 && totalLessons === 0) {
    return null;
  }

  return buildProgressSummary(
    cachedOwnProgress.filter((record) => record.completed).length,
    totalLessons
  );
};

const setCourseProgressSnapshot = (
  courseId: string,
  summary: CourseProgressSummary
): CourseProgressSummary => {
  courseProgressSnapshots.set(courseId, {
    summary,
    updatedAt: Date.now(),
  });

  return summary;
};

const getFreshCourseProgressSnapshot = (
  courseId: string
): CourseProgressSummary | null => {
  const snapshot = courseProgressSnapshots.get(courseId);
  if (!snapshot) {
    return null;
  }

  if (Date.now() - snapshot.updatedAt > COURSE_PROGRESS_MEMORY_TTL_MS) {
    courseProgressSnapshots.delete(courseId);
    return null;
  }

  return snapshot.summary;
};

export const clearCourseProgressCache = (courseId?: string): void => {
  if (courseId) {
    courseProgressRequests.delete(courseId);
    courseProgressSnapshots.delete(courseId);
    return;
  }

  courseProgressRequests.clear();
  courseProgressSnapshots.clear();
};

/**
 * Mark lesson as completed (Student only)
 */
export const markLessonComplete = async (lessonId: string): Promise<Progress> => {
  try {
    const response = await apiClient.post(`/api/progress/${lessonId}`);
    const record = response.data.data;
    cacheProgressRecords([record]);
    const cachedSummary = getCachedCourseProgressSummary(record.course_id);
    if (cachedSummary) {
      setCourseProgressSnapshot(record.course_id, cachedSummary);
    } else {
      clearCourseProgressCache(record.course_id);
    }
    return record;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get progress summary for a course
 */
export const getCourseProgress = async (
  courseId: string
): Promise<CourseProgressSummary> => {
  const freshSnapshot = getFreshCourseProgressSnapshot(courseId);
  if (freshSnapshot) {
    return freshSnapshot;
  }

  const inFlightRequest = courseProgressRequests.get(courseId);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async () => {
    try {
      const response = await apiClient.get(`/api/progress/${courseId}`);
      const progress = response.data.data;

      if (Array.isArray(progress)) {
        cacheProgressRecords(progress);
        return setCourseProgressSnapshot(
          courseId,
          buildProgressSummary(
            progress.filter((record) => record.completed).length,
            progress.length
          )
        );
      }

      return setCourseProgressSnapshot(courseId, {
        completed: progress.completed || 0,
        total: progress.total || 0,
        percentage: progress.percentage || 0,
      });
    } catch (error) {
      const cachedSummary = getCachedCourseProgressSummary(courseId);
      if (cachedSummary) {
        return setCourseProgressSnapshot(courseId, cachedSummary);
      }
      throw handleApiError(error);
    } finally {
      courseProgressRequests.delete(courseId);
    }
  })();

  courseProgressRequests.set(courseId, request);
  return request;
};

/**
 * Update lesson progress (Student)
 */
export const updateLessonProgress = async (
  lessonId: string,
  data: Record<string, unknown>
): Promise<Progress> => {
  try {
    const response = await apiClient.put(`/api/progress/${lessonId}`, data);
    const record = response.data.data;
    cacheProgressRecords([record]);
    const cachedSummary = getCachedCourseProgressSummary(record.course_id);
    if (cachedSummary) {
      setCourseProgressSnapshot(record.course_id, cachedSummary);
    } else {
      clearCourseProgressCache(record.course_id);
    }
    return record;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reset course progress (Student)
 */
export const resetCourseProgress = async (courseId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/progress/${courseId}`);

    const user = readCachedAuthUser();
    if (user) {
      removeCachedCourseProgress(user._id, courseId);
    }

    const cachedSummary = getCachedCourseProgressSummary(courseId);
    if (cachedSummary) {
      setCourseProgressSnapshot(courseId, cachedSummary);
    } else {
      clearCourseProgressCache(courseId);
    }
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCachedCompletedLessonIdsForCourse = (
  courseId: string
): string[] => {
  return getCompletedLessonIds(
    readCachedProgress().filter((record) => record.course_id === courseId)
  );
};

/**
 * Calculate course completion percentage
 */
export const calculateCourseCompletion = (
  completedLessons: number,
  totalLessons: number
): number => {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
};

/**
 * Check if a lesson is completed
 */
export const isLessonCompleted = (
  lessonId: string,
  progressRecords: Progress[]
): boolean => {
  return progressRecords.some(
    (record) => record.lesson_id === lessonId && record.completed
  );
};

/**
 * Get completed lesson IDs for a course
 */
export const getCompletedLessonIds = (progressRecords: Progress[]): string[] => {
  return progressRecords
    .filter((record) => record.completed)
    .map((record) => record.lesson_id);
};
