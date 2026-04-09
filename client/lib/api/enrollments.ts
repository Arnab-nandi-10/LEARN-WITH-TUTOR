import apiClient, { handleApiError } from './client';
import type { Course, Enrollment, EnrollmentWithCourse, User } from '../types';
import { getCachedCourseById } from './courses';

// ============================================================
// ENROLLMENT API SERVICES
// ============================================================

const ENROLLMENT_CACHE_KEY = 'tutor-enrollment-cache';
const AUTH_STORAGE_KEY = 'auth-storage';
const ENROLLMENT_MEMORY_TTL_MS = 15_000;

type CachedUserSnapshot = Pick<User, '_id' | 'name' | 'email'>;
type MyEnrollmentsOptions = {
  force?: boolean;
};

let myEnrollmentsRequest: Promise<EnrollmentWithCourse[]> | null = null;
let myEnrollmentsSnapshot: EnrollmentWithCourse[] | null = null;
let myEnrollmentsSnapshotAt = 0;

export interface CachedEnrollmentRecord extends EnrollmentWithCourse {
  user?: CachedUserSnapshot;
}

const canUseEnrollmentCache = (): boolean => typeof window !== 'undefined';

const readCachedAuthUser = (): User | null => {
  if (!canUseEnrollmentCache()) return null;

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

const setMyEnrollmentsSnapshot = (
  enrollments: EnrollmentWithCourse[]
): EnrollmentWithCourse[] => {
  myEnrollmentsSnapshot = enrollments;
  myEnrollmentsSnapshotAt = Date.now();
  return enrollments;
};

const getFreshMyEnrollmentsSnapshot = (): EnrollmentWithCourse[] | null => {
  if (!myEnrollmentsSnapshot) {
    return null;
  }

  if (Date.now() - myEnrollmentsSnapshotAt > ENROLLMENT_MEMORY_TTL_MS) {
    return null;
  }

  return myEnrollmentsSnapshot;
};

const readCachedEnrollments = (): CachedEnrollmentRecord[] => {
  if (!canUseEnrollmentCache()) return [];

  try {
    const raw = localStorage.getItem(ENROLLMENT_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CachedEnrollmentRecord[]) : [];
  } catch {
    return [];
  }
};

const writeCachedEnrollments = (enrollments: CachedEnrollmentRecord[]): void => {
  if (!canUseEnrollmentCache()) return;

  try {
    localStorage.setItem(ENROLLMENT_CACHE_KEY, JSON.stringify(enrollments));
  } catch {
    // Ignore cache write failures and keep API flow working.
  }
};

const removeCachedEnrollment = (userId: string, courseId: string): void => {
  writeCachedEnrollments(
    readCachedEnrollments().filter(
      (enrollment) =>
        !(enrollment.user_id === userId && enrollment.course_id === courseId)
    )
  );
};

const getEnrollmentCacheId = (
  enrollment: Partial<EnrollmentWithCourse>
): string => {
  return (
    enrollment._id ||
    `${enrollment.user_id || 'unknown'}:${enrollment.course_id || 'unknown'}`
  );
};

const isCourseObject = (value: unknown): value is Course => {
  return !!value && typeof value === 'object' && '_id' in value && 'title' in value;
};

const hydrateEnrollment = (
  enrollment: EnrollmentWithCourse | Enrollment
): CachedEnrollmentRecord => {
  const enrollmentWithPossibleCourse = enrollment as EnrollmentWithCourse & {
    course_id: string | Course;
  };
  const courseFromCourseId = isCourseObject(enrollmentWithPossibleCourse.course_id)
    ? enrollmentWithPossibleCourse.course_id
    : undefined;
  const resolvedCourseId = courseFromCourseId
    ? courseFromCourseId._id
    : enrollmentWithPossibleCourse.course_id;
  const cachedCourse = getCachedCourseById(resolvedCourseId);

  return {
    ...(enrollment as EnrollmentWithCourse),
    course_id: resolvedCourseId,
    course:
      ('course' in enrollment ? enrollment.course : undefined) ||
      courseFromCourseId ||
      cachedCourse ||
      undefined,
  };
};

const cacheEnrollments = (enrollments: EnrollmentWithCourse[]): void => {
  if (enrollments.length === 0) return;

  const existing = readCachedEnrollments();
  const user = getUserSnapshot();
  const enrollmentMap = new Map<string, CachedEnrollmentRecord>();

  existing.forEach((enrollment) => {
    enrollmentMap.set(getEnrollmentCacheId(enrollment), enrollment);
  });

  enrollments.forEach((enrollment) => {
    const hydratedEnrollment = hydrateEnrollment(enrollment);
    const cacheId = getEnrollmentCacheId(hydratedEnrollment);
    const previous = enrollmentMap.get(cacheId);

    enrollmentMap.set(cacheId, {
      ...previous,
      ...hydratedEnrollment,
      user: user || previous?.user,
    });
  });

  writeCachedEnrollments(Array.from(enrollmentMap.values()));
};

const replaceOwnCachedEnrollments = (
  enrollments: EnrollmentWithCourse[]
): CachedEnrollmentRecord[] => {
  const user = getUserSnapshot();
  const hydratedEnrollments = enrollments.map(hydrateEnrollment);

  if (!user?._id) {
    cacheEnrollments(hydratedEnrollments);
    return hydratedEnrollments;
  }

  const otherUserEnrollments = readCachedEnrollments().filter(
    (enrollment) => enrollment.user_id !== user._id
  );
  const ownEnrollments = hydratedEnrollments.map((enrollment) => ({
    ...enrollment,
    user,
  }));

  writeCachedEnrollments([...otherUserEnrollments, ...ownEnrollments]);
  return ownEnrollments;
};

const syncOwnEnrollmentSnapshotFromCache = (): CachedEnrollmentRecord[] => {
  return setMyEnrollmentsSnapshot(getCachedOwnEnrollments());
};

const getCachedOwnEnrollments = (): CachedEnrollmentRecord[] => {
  const user = readCachedAuthUser();
  if (!user) return [];

  return readCachedEnrollments().filter(
    (enrollment) => enrollment.user_id === user._id
  );
};

export const getCachedEnrollments = (): CachedEnrollmentRecord[] => {
  return readCachedEnrollments();
};

export const clearMyEnrollmentsCache = (): void => {
  myEnrollmentsRequest = null;
  myEnrollmentsSnapshot = null;
  myEnrollmentsSnapshotAt = 0;
};

/**
 * Enroll in a course (Student only)
 */
export const enrollInCourse = async (courseId: string): Promise<Enrollment> => {
  try {
    const response = await apiClient.post(`/api/enrollments/${courseId}`);
    const enrollment = response.data.data;
    cacheEnrollments([hydrateEnrollment(enrollment)]);
    syncOwnEnrollmentSnapshotFromCache();
    return enrollment;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all my enrollments (Student)
 */
export const getMyEnrollments = async (
  options: MyEnrollmentsOptions = {}
): Promise<EnrollmentWithCourse[]> => {
  if (!options.force) {
    const freshSnapshot = getFreshMyEnrollmentsSnapshot();
    if (freshSnapshot) {
      return freshSnapshot;
    }
  }

  if (myEnrollmentsRequest) {
    return myEnrollmentsRequest;
  }

  myEnrollmentsRequest = (async () => {
    try {
      const response = await apiClient.get('/api/enrollments/my');
      const enrollments = replaceOwnCachedEnrollments(response.data.data);
      return setMyEnrollmentsSnapshot(enrollments);
    } catch (error) {
      const cachedOwnEnrollments = getCachedOwnEnrollments();
      if (cachedOwnEnrollments.length > 0) {
        return setMyEnrollmentsSnapshot(cachedOwnEnrollments);
      }
      throw handleApiError(error);
    } finally {
      myEnrollmentsRequest = null;
    }
  })();

  return myEnrollmentsRequest;
};

/**
 * Update an enrollment (Student)
 */
export const updateEnrollment = async (
  courseId: string,
  data: Record<string, unknown>
): Promise<EnrollmentWithCourse> => {
  try {
    const response = await apiClient.put(`/api/enrollments/${courseId}`, data);
    const enrollment = hydrateEnrollment(response.data.data);
    cacheEnrollments([enrollment]);
    syncOwnEnrollmentSnapshotFromCache();
    return enrollment;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Unenroll from a course (Student)
 */
export const unenrollFromCourse = async (courseId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/enrollments/${courseId}`);

    const user = readCachedAuthUser();
    if (user) {
      removeCachedEnrollment(user._id, courseId);
    }

    syncOwnEnrollmentSnapshotFromCache();
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Check if enrolled in a course
 */
export const checkEnrollment = async (courseId: string): Promise<boolean> => {
  try {
    const enrollments = await getMyEnrollments();
    return enrollments.some((enrollment) => enrollment.course_id === courseId);
  } catch (error) {
    return false;
  }
};

/**
 * Get enrollment status for a course
 */
export const getEnrollmentStatus = async (
  courseId: string
): Promise<Enrollment | null> => {
  try {
    const enrollments = await getMyEnrollments();
    return enrollments.find((enrollment) => enrollment.course_id === courseId) || null;
  } catch (error) {
    return null;
  }
};
