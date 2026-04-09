import apiClient, { handleApiError } from './client';
import type { Module, ModuleFormData, ModuleReorderData } from '../types';

// ============================================================
// MODULE API SERVICES
// ============================================================

/**
 * Create module in course (Faculty - course owner only)
 */
export const createModule = async (
  courseId: string,
  data: ModuleFormData
): Promise<Module> => {
  try {
    const response = await apiClient.post(`/api/courses/${courseId}/modules`, data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all modules for a course
 */
export const getModules = async (courseId: string): Promise<Module[]> => {
  try {
    const response = await apiClient.get(`/api/courses/${courseId}/modules`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reorder modules in a course (Faculty - course owner only)
 */
export const reorderModules = async (
  courseId: string,
  data: ModuleReorderData
): Promise<void> => {
  try {
    await apiClient.patch(`/api/courses/${courseId}/modules/reorder`, data);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update module
 */
export const updateModule = async (
  courseId: string,
  moduleId: string,
  data: Partial<ModuleFormData>
): Promise<Module> => {
  try {
    const response = await apiClient.put(
      `/api/courses/${courseId}/modules/${moduleId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete module
 */
export const deleteModule = async (courseId: string, moduleId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/courses/${courseId}/modules/${moduleId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};
