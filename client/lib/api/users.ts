import apiClient, { handleApiError } from './client';
import type { EnrollmentWithCourse, User } from '../types';

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get('/api/users');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await apiClient.get(`/api/users/${userId}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUserEnrollments = async (
  userId: string
): Promise<EnrollmentWithCourse[]> => {
  try {
    const response = await apiClient.get(`/api/users/${userId}/enrollments`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
