import * as analyticsApi from '@/lib/api/analytics';
import * as businessApi from '@/lib/api/business';
import * as coursesApi from '@/lib/api/courses';
import * as usersApi from '@/lib/api/users';
import type { Course, Analytics, User } from '@/lib/types';

export interface AdminCourseInsight {
  course: Course;
  analytics: Analytics | null;
  enrolledStudents: number;
  totalLessons: number;
  totalAttempts: number;
  totalProgressRecords: number;
}

export interface AdminOverviewData {
  users: User[];
  courses: AdminCourseInsight[];
}

export const loadAdminOverview = async (): Promise<AdminOverviewData> => {
  const [users, knownCourses, approvedCourses, rejectedCourses] = await Promise.all([
    usersApi.getAllUsers(),
    coursesApi.getAllKnownCourses(),
    businessApi.getApprovedCourses().catch(() => []),
    businessApi.getRejectedCourses().catch(() => []),
  ]);
  const dedupedCourses = Array.from(
    new Map(
      [...knownCourses, ...approvedCourses, ...rejectedCourses].map((course) => [
        course._id,
        course,
      ])
    ).values()
  );
  const courses = await Promise.all(
    dedupedCourses.map(async (course) => {
      const analytics = await analyticsApi
        .getCourseAnalytics(course._id)
        .catch(() => null);
      const cachedFullCourse = coursesApi.getCachedFullCourse(course._id);
      const totalLessons =
        cachedFullCourse?.modules.reduce(
          (sum, module) => sum + (module.lessons?.length || 0),
          0
        ) ?? 0;

      return {
        course,
        analytics,
        enrolledStudents: analytics?.total_students ?? 0,
        totalLessons,
        totalAttempts: analytics?.total_attempts ?? 0,
        totalProgressRecords: analytics?.total_progress_records ?? 0,
      };
    })
  );

  courses.sort(
    (left, right) =>
      new Date(right.course.updatedAt).getTime() -
      new Date(left.course.updatedAt).getTime()
  );

  users.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  return {
    users,
    courses,
  };
};
