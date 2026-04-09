import apiClient, { handleApiError } from './client';
import type { Lesson, LessonFormData, LessonReorderData } from '../types';

// ============================================================
// LESSON API SERVICES
// ============================================================

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

/**
 * Create lesson in module (Faculty - course owner only)
 */
export const createLesson = async (
  moduleId: string,
  data: LessonFormData
): Promise<Lesson> => {
  try {
    const response = await apiClient.post(`/api/modules/${moduleId}/lessons`, data);
    return normalizeLesson(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all lessons for a module
 */
export const getLessons = async (moduleId: string): Promise<Lesson[]> => {
  try {
    const response = await apiClient.get(`/api/modules/${moduleId}/lessons`);
    return response.data.data.map((lesson: Lesson) => normalizeLesson(lesson));
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reorder lessons in a module (Faculty - course owner only)
 */
export const reorderLessons = async (
  moduleId: string,
  data: LessonReorderData
): Promise<void> => {
  try {
    await apiClient.patch(`/api/modules/${moduleId}/lessons/reorder`, data);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update lesson
 */
export const updateLesson = async (
  moduleId: string,
  lessonId: string,
  data: Partial<LessonFormData>
): Promise<Lesson> => {
  try {
    const response = await apiClient.put(
      `/api/modules/${moduleId}/lessons/${lessonId}`,
      data
    );
    return normalizeLesson(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete lesson
 */
export const deleteLesson = async (moduleId: string, lessonId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/modules/${moduleId}/lessons/${lessonId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get single lesson by ID
 */
export const getLessonById = async (
  moduleId: string,
  lessonId: string
): Promise<Lesson> => {
  try {
    const response = await apiClient.get(`/api/modules/${moduleId}/lessons/${lessonId}`);
    return normalizeLesson(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};
