import apiClient, { handleApiError } from './client';
import type {
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
  User,
} from '../types';

// ============================================================
// AUTH API SERVICES   
// ============================================================

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Sign up new user
 */
export const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/api/auth/signup', credentials);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<string> => {
  try {
    const response = await apiClient.post('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data.data.access_token;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Logout user
 */
export const logout = async (refreshToken: string): Promise<void> => {
  try {
    await apiClient.post('/api/auth/logout', {
      refresh_token: refreshToken,
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get the authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
