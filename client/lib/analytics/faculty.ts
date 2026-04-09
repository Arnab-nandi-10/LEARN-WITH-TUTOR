import * as analyticsApi from '@/lib/api/analytics';
import * as coursesApi from '@/lib/api/courses';
import {
  getCachedEnrollments,
  type CachedEnrollmentRecord,
} from '@/lib/api/enrollments';
import {
  getCachedProgressRecords,
  type CachedProgressRecord,
} from '@/lib/api/progress';
import type {
  Analytics,
  Course,
  EnrollmentStatus,
  FullCourse,
} from '@/lib/types';

export interface CourseStudentProgress {
  userId: string;
  name: string;
  email: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  enrollmentStatus: EnrollmentStatus;
  lastActivityAt: string | null;
}

export interface CourseAnalyticsSummary {
  course: Course;
  totalLessons: number;
  enrolledStudents: number;
  trackedStudents: number;
  activeStudents: number;
  completedStudents: number;
  averageCompletion: number;
  totalProgressRecords: number;
  totalAttempts: number;
  studentProgress: CourseStudentProgress[];
}

const getUniqueRecords = <T,>(items: T[], getKey: (item: T) => string): T[] => {
  const map = new Map<string, T>();

  items.forEach((item) => {
    map.set(getKey(item), item);
  });

  return Array.from(map.values());
};

const getLessonIds = (fullCourse: FullCourse): string[] => {
  return fullCourse.modules.flatMap((module) =>
    (module.lessons || []).map((lesson) => lesson._id)
  );
};

const getStudentLabel = (
  userId: string,
  record?: { user?: { name?: string; email?: string } }
): { name: string; email: string } => {
  const name = record?.user?.name?.trim();
  const email = record?.user?.email?.trim();

  return {
    name: name || `Student ${userId.slice(-4).toUpperCase()}`,
    email: email || '',
  };
};

const getLatestTimestamp = (values: Array<string | null | undefined>): string | null => {
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
};

const buildStudentProgress = (
  userId: string,
  lessonIds: string[],
  enrollments: CachedEnrollmentRecord[],
  progressRecords: CachedProgressRecord[]
): CourseStudentProgress => {
  const lessonIdSet = new Set(lessonIds);
  const enrollment = enrollments.find((record) => record.user_id === userId);
  const relevantProgress = getUniqueRecords(
    progressRecords.filter(
      (record) =>
        record.user_id === userId &&
        record.completed &&
        lessonIdSet.has(record.lesson_id)
    ),
    (record) => record.lesson_id
  );
  const identitySource = enrollment || relevantProgress[0];
  const identity = getStudentLabel(userId, identitySource);
  const completedLessons = relevantProgress.length;
  const totalLessons = lessonIds.length;
  const progressPercentage =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
  const enrollmentStatus: EnrollmentStatus =
    enrollment?.status === 'completed' || progressPercentage === 100
      ? 'completed'
      : 'active';

  return {
    userId,
    name: identity.name,
    email: identity.email,
    completedLessons,
    totalLessons,
    progressPercentage,
    enrollmentStatus,
    lastActivityAt: getLatestTimestamp([
      enrollment?.updatedAt,
      enrollment?.enrolled_at,
      ...relevantProgress.map((record) => record.updatedAt || record.createdAt),
    ]),
  };
};

export const buildCourseAnalyticsSummary = (
  fullCourse: FullCourse,
  overview?: Analytics | null
): CourseAnalyticsSummary => {
  const lessonIds = getLessonIds(fullCourse);
  const enrollments = getUniqueRecords(
    getCachedEnrollments().filter(
      (record) => record.course_id === fullCourse.course._id
    ),
    (record) => record._id || `${record.user_id}:${record.course_id}`
  );
  const progressRecords = getCachedProgressRecords().filter(
    (record) => record.course_id === fullCourse.course._id
  );
  const userIds = new Set<string>();

  enrollments.forEach((record) => {
    if (record.user_id) {
      userIds.add(record.user_id);
    }
  });

  progressRecords.forEach((record) => {
    if (record.user_id) {
      userIds.add(record.user_id);
    }
  });

  // Build student progress from cached data (backend doesn't provide detailed student list)
  const studentProgress = Array.from(userIds)
    .map((userId) =>
      buildStudentProgress(userId, lessonIds, enrollments, progressRecords)
    )
    .sort((left, right) => {
      if (right.progressPercentage !== left.progressPercentage) {
        return right.progressPercentage - left.progressPercentage;
      }
      return left.name.localeCompare(right.name);
    });

  const completedStudents = studentProgress.filter(
    (student) =>
      student.enrollmentStatus === 'completed' || student.progressPercentage === 100
  ).length;
  const trackedStudents = studentProgress.length;
  const enrolledStudents = Math.max(overview?.total_students || 0, trackedStudents);
  const activeStudents = Math.max(enrolledStudents - completedStudents, 0);
  const averageCompletion =
    studentProgress.length > 0
      ? Math.round(
          studentProgress.reduce(
            (sum, student) => sum + student.progressPercentage,
            0
          ) / studentProgress.length
        )
      : 0;

  return {
    course: fullCourse.course,
    totalLessons: lessonIds.length,
    enrolledStudents,
    trackedStudents,
    activeStudents,
    completedStudents,
    averageCompletion,
    totalProgressRecords: overview?.total_progress_records ?? progressRecords.length,
    totalAttempts: overview?.total_attempts ?? 0,
    studentProgress,
  };
};

const loadFullCourseWithFallback = async (course: Course): Promise<FullCourse> => {
  const cached = coursesApi.getCachedFullCourse(course._id);
  if (cached) {
    return cached;
  }

  try {
    return await coursesApi.getFullCourse(course._id);
  } catch {
    return {
      course,
      modules: [],
    };
  }
};

export const loadFacultyCourseAnalytics = async (): Promise<
  CourseAnalyticsSummary[]
> => {
  const courses = await coursesApi.getMyCourses();
  const courseAnalytics = await Promise.all(
    courses.map(async (course) => {
      const [fullCourse, overview] = await Promise.all([
        loadFullCourseWithFallback(course),
        analyticsApi.getCourseAnalytics(course._id).catch(() => null),
      ]);

      return buildCourseAnalyticsSummary(fullCourse, overview);
    })
  );

  return courseAnalytics;
};

export const hasCachedStudentActivity = (): boolean => {
  return (
    getCachedEnrollments().length > 0 || getCachedProgressRecords().length > 0
  );
};
