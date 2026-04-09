import apiClient, { handleApiError } from './client';
import type {
  Course,
  CourseFormData,
  FullCourse,
  Lesson,
  ModuleWithLessons,
  User,
} from '../types';

// ============================================================
// COURSE API SERVICES
// ============================================================

const COURSE_CACHE_KEY = 'tutor-course-cache';
const FULL_COURSE_CACHE_KEY = 'tutor-full-course-cache';
const AUTH_STORAGE_KEY = 'auth-storage';

const canUseCourseCache = (): boolean => typeof window !== 'undefined';

const readCachedCourses = (): Course[] => {
  if (!canUseCourseCache()) return [];

  try {
    const raw = localStorage.getItem(COURSE_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Course[]) : [];
  } catch {
    return [];
  }
};

const readCachedAuthUser = (): User | null => {
  if (!canUseCourseCache()) return null;

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

const writeCachedCourses = (courses: Course[]): void => {
  if (!canUseCourseCache()) return;

  try {
    localStorage.setItem(COURSE_CACHE_KEY, JSON.stringify(courses));
  } catch {
    // Ignore cache write failures and keep API flow working.
  }
};

const readCachedFullCourses = (): FullCourse[] => {
  if (!canUseCourseCache()) return [];

  try {
    const raw = localStorage.getItem(FULL_COURSE_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FullCourse[]) : [];
  } catch {
    return [];
  }
};

const writeCachedFullCourses = (courses: FullCourse[]): void => {
  if (!canUseCourseCache()) return;

  try {
    localStorage.setItem(FULL_COURSE_CACHE_KEY, JSON.stringify(courses));
  } catch {
    // Ignore cache write failures and keep API flow working.
  }
};

const removeCachedCourse = (courseId: string): void => {
  if (!canUseCourseCache()) return;

  writeCachedCourses(readCachedCourses().filter((course) => course._id !== courseId));
  writeCachedFullCourses(
    readCachedFullCourses().filter((course) => course.course._id !== courseId)
  );
};

const mergeCourses = (existing: Course[], incoming: Course[]): Course[] => {
  const courseMap = new Map<string, Course>();

  existing.forEach((course) => {
    courseMap.set(course._id, course);
  });

  incoming.forEach((course) => {
    courseMap.set(course._id, course);
  });

  return Array.from(courseMap.values());
};

const syncPublicCourseCache = (publicCourses: Course[]): Course[] => {
  const existingCourses = readCachedCourses();
  const privateOrRejectedCourses = existingCourses.filter(
    (course) => course.status !== 'published' || course.isApproved === false
  );
  const nextCourses = mergeCourses(privateOrRejectedCourses, publicCourses);
  writeCachedCourses(nextCourses);
  return publicCourses;
};

const normalizeLesson = (lesson: Lesson): Lesson => {
  const type = lesson.type || lesson.content_type || 'text';

  return {
    ...lesson,
    type,
    content_type: lesson.content_type || type,
    content: lesson.content || lesson.content_text,
    video_url: lesson.video_url || (type === 'video' ? lesson.content_url : undefined),
    file_url: lesson.file_url || (type === 'file' ? lesson.content_url : undefined),
  };
};

const normalizeModule = (module: ModuleWithLessons): ModuleWithLessons => {
  return {
    ...module,
    lessons: Array.isArray(module.lessons)
      ? module.lessons.map((lesson) => normalizeLesson(lesson))
      : [],
  };
};

const normalizeFullCourse = (fullCourse: FullCourse): FullCourse => {
  return {
    ...fullCourse,
    modules: Array.isArray(fullCourse.modules)
      ? fullCourse.modules.map((module) => normalizeModule(module))
      : [],
  };
};

const cacheCourses = (courses: Course[]): Course[] => {
  if (courses.length === 0) {
    return readCachedCourses();
  }

  const mergedCourses = mergeCourses(readCachedCourses(), courses);
  writeCachedCourses(mergedCourses);
  return mergedCourses;
};

const cacheCourse = (course: Course): void => {
  if (!course?._id) return;
  cacheCourses([course]);
};

const cacheFullCourse = (fullCourse: FullCourse): void => {
  if (!fullCourse?.course?._id) return;

  const existing = readCachedFullCourses();
  const next = [
    fullCourse,
    ...existing.filter((item) => item.course._id !== fullCourse.course._id),
  ];

  writeCachedFullCourses(next);
  cacheCourse(fullCourse.course);
};

export const getCachedCourses = (): Course[] => {
  return readCachedCourses();
};

export const getCachedCourseById = (courseId: string): Course | null => {
  return readCachedCourses().find((course) => course._id === courseId) || null;
};

export const getCachedFullCourse = (courseId: string): FullCourse | null => {
  return (
    readCachedFullCourses().find((course) => course.course._id === courseId) ||
    null
  );
};

export const getCachedFacultyCourses = (): Course[] => {
  const cachedCourses = readCachedCourses();
  const cachedUser = readCachedAuthUser();

  if (!cachedUser) {
    return [];
  }

  return cachedCourses.filter((course) => course.faculty_id === cachedUser._id);
};

export const getAllKnownCourses = async (): Promise<Course[]> => {
  const cachedCourses = readCachedCourses();

  try {
    const response = await apiClient.get('/api/courses');
    const backendCourses = response.data.data as Course[];
    return cacheCourses(mergeCourses(cachedCourses, backendCourses));
  } catch (error) {
    if (cachedCourses.length > 0) {
      return cachedCourses;
    }

    throw handleApiError(error);
  }
};

/**
 * Create a new course (Faculty only)
 */
export const createCourse = async (data: CourseFormData): Promise<Course> => {
  try {
    const response = await apiClient.post('/api/courses', data);
    const course = response.data.data;
    cacheCourse(course);
    return course;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update course (Faculty - owner only)
 */
export const updateCourse = async (
  courseId: string,
  data: Partial<CourseFormData>
): Promise<Course> => {
  try {
    const response = await apiClient.put(`/api/courses/${courseId}`, data);
    const course = response.data.data;
    cacheCourse(course);
    return course;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Publish course (Faculty - owner only)
 */
export const publishCourse = async (courseId: string): Promise<Course> => {
  try {
    const response = await apiClient.patch(`/api/courses/${courseId}/publish`);
    const course = response.data.data;
    cacheCourse(course);
    return course;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get my courses (Faculty)
 */
export const getMyCourses = async (): Promise<Course[]> => {
  const cachedFacultyCourses = getCachedFacultyCourses();

  if (cachedFacultyCourses.length > 0) {
    return cachedFacultyCourses;
  }

  try {
    const response = await apiClient.get('/api/courses/my');
    const courses = response.data.data;
    cacheCourses(courses);
    return courses;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get faculty courses from the dedicated faculty endpoint
 */
export const getFacultyCourses = async (): Promise<Course[]> => {
  const cachedFacultyCourses = getCachedFacultyCourses();

  try {
    const response = await apiClient.get('/api/courses/faculty');
    const courses = response.data.data;
    cacheCourses(courses);
    return courses;
  } catch (error) {
    if (cachedFacultyCourses.length > 0) {
      return cachedFacultyCourses;
    }

    throw handleApiError(error);
  }
};

/**
 * Get full course with modules and lessons
 */
export const getFullCourse = async (courseId: string): Promise<FullCourse> => {
  try {
    const response = await apiClient.get(`/api/courses/${courseId}/full`);
    const fullCourse = normalizeFullCourse(response.data.data);
    cacheFullCourse(fullCourse);
    return fullCourse;
  } catch (error) {
    const handledError = handleApiError(error);

    if ([403, 404].includes(handledError.statusCode || 0)) {
      removeCachedCourse(courseId);
    }

    if ([401, 403, 404].includes(handledError.statusCode || 0)) {
      throw handledError;
    }

    const cachedFullCourse = getCachedFullCourse(courseId);
    if (cachedFullCourse) {
      return cachedFullCourse;
    }
    throw handledError;
  }
};

/**
 * Get all published courses (for browsing/catalog)
 */
export const getAllCourses = async (page?: number, limit?: number): Promise<Course[]> => {
  const cachedPublishedCourses = readCachedCourses().filter(
    (course) => course.status === 'published' && course.isApproved !== false
  );

  try {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));

    const url = params.toString() ? `/api/courses?${params.toString()}` : '/api/courses';
    const response = await apiClient.get(url);
    const courses = response.data.data as Course[];
    return syncPublicCourseCache(courses);
  } catch (error) {
    if (cachedPublishedCourses.length > 0) {
      return cachedPublishedCourses;
    }

    throw handleApiError(error);
  }
};

/**
 * Get single course by ID
 */
export const getCourseById = async (courseId: string): Promise<Course> => {
  const cachedCourse = getCachedCourseById(courseId);

  if (cachedCourse) {
    return cachedCourse;
  }

  try {
    const response = await apiClient.get(`/api/courses/${courseId}`);
    const course = response.data.data;
    cacheCourse(course);
    return course;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete a course (Faculty - owner only)
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/courses/${courseId}`);
    removeCachedCourse(courseId);
  } catch (error) {
    throw handleApiError(error);
  }
};
