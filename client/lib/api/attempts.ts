import apiClient, { handleApiError } from './client';
import type { AttemptSubmitData, AttemptResult, Exam, ExamAttempt } from '../types';

// ============================================================
// ATTEMPT API SERVICES
// ============================================================

const normalizeAttemptResult = (value: unknown): AttemptResult | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const result = value as {
    score?: unknown;
    total?: unknown;
    passed?: unknown;
    submitted_at?: unknown;
    attempt?: {
      score?: unknown;
      createdAt?: unknown;
    };
    exam?: {
      total_marks?: unknown;
      passing_marks?: unknown;
    };
  };

  if (
    typeof result.score === 'number' &&
    typeof result.total === 'number' &&
    typeof result.passed === 'boolean'
  ) {
    return {
      score: result.score,
      total: result.total,
      passed: result.passed,
      submitted_at:
        typeof result.submitted_at === 'string' ? result.submitted_at : undefined,
    };
  }

  if (
    typeof result.attempt?.score === 'number' &&
    typeof result.exam?.total_marks === 'number'
  ) {
    return {
      score: result.attempt.score,
      total: result.exam.total_marks,
      passed:
        typeof result.passed === 'boolean'
          ? result.passed
          : result.attempt.score >= Number(result.exam?.passing_marks || 0),
      submitted_at:
        typeof result.attempt.createdAt === 'string'
          ? result.attempt.createdAt
          : undefined,
    };
  }

  return null;
};

const ATTEMPT_CACHE_PREFIX = 'attempt_';

const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const authStorageRaw = localStorage.getItem('auth-storage');
    if (!authStorageRaw) {
      return null;
    }

    const authStorageParsed = JSON.parse(authStorageRaw) as {
      state?: {
        user?: {
          _id?: unknown;
          id?: unknown;
        };
      };
    };

    const maybeUserId =
      authStorageParsed?.state?.user?._id ?? authStorageParsed?.state?.user?.id;

    return typeof maybeUserId === 'string' && maybeUserId.length > 0
      ? maybeUserId
      : null;
  } catch {
    return null;
  }
};

const getAttemptCacheKey = (examId: string, userId: string): string => {
  return `${ATTEMPT_CACHE_PREFIX}${userId}_${examId}`;
};

/**
 * Submit exam attempt (Student only)
 * Backend: POST /api/attempts/:exam_id
 */
export const submitAttempt = async (
  examId: string,
  data: AttemptSubmitData
): Promise<AttemptResult> => {
  try {
    const response = await apiClient.post(`/api/attempts/${examId}`, data);
    const normalized = normalizeAttemptResult(response.data.data);

    if (!normalized) {
      throw new Error('Unexpected attempt result payload');
    }

    return normalized;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAttemptResultForExam = async (
  examId: string,
  examMeta?: Pick<Exam, 'total_marks' | 'passing_marks'>
): Promise<AttemptResult | null> => {
  try {
    const response = await apiClient.get(`/api/attempts/exam/${examId}`);
    const data = response.data.data;

    if (!data) {
      return null;
    }

    const normalized = normalizeAttemptResult({
      attempt: data,
      exam: examMeta,
    });

    if (!normalized) {
      throw new Error('Unexpected attempt payload');
    }

    return normalized;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get attempt detail by ID
 * Backend: GET /api/attempts/:id
 */
export const getAttemptById = async (attemptId: string): Promise<ExamAttempt> => {
  try {
    const response = await apiClient.get(`/api/attempts/${attemptId}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get cached attempt result (helper for client-side caching)
 * Note: Backend only allows one attempt, so we can cache locally
 */
export const getCachedAttemptResult = (examId: string): AttemptResult | null => {
  if (typeof window === 'undefined') return null;

  const userId = getCurrentUserId();
  if (!userId) {
    return null;
  }
  
  try {
    const cached = localStorage.getItem(getAttemptCacheKey(examId, userId));
    return cached ? normalizeAttemptResult(JSON.parse(cached)) : null;
  } catch {
    return null;
  }
};

/**
 * Cache attempt result locally
 */
export const cacheAttemptResult = (examId: string, result: AttemptResult): void => {
  if (typeof window === 'undefined') return;

  const userId = getCurrentUserId();
  if (!userId) {
    return;
  }
  
  try {
    localStorage.setItem(getAttemptCacheKey(examId, userId), JSON.stringify(result));
  } catch {
    // Ignore cache errors
  }
};

export const clearAttemptResultCache = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (key?.startsWith(ATTEMPT_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // Ignore cache clear errors
  }
};
