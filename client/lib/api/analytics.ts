import apiClient, { handleApiError } from './client';
import type { Analytics } from '../types';

// ============================================================
// ANALYTICS API SERVICES
// ============================================================

/**
 * Get course analytics
 * Backend: GET /api/analytics/:course_id
 */
export const getCourseAnalytics = async (courseId: string): Promise<Analytics> => {
  try {
    const response = await apiClient.get(`/api/analytics/${courseId}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

