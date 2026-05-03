import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError } from '../types';

// ============================================================
// API CLIENT CONFIGURATION
// ============================================================

const DEFAULT_LOCAL_API_URL = 'https://learn-with-tutor.onrender.com';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_LOCAL_API_URL;

const LOCAL_API_CANDIDATES = Array.from(
  new Set([
    API_BASE_URL,
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
  ])
);
const normalizeOrigin = (value?: string | null): string | null => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const isLocalOrigin = (value?: string | null) => {
  const origin = normalizeOrigin(value);

  if (!origin) return false;

  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const getNextLocalApiBaseUrl = (
  currentBaseUrl?: string | null,
  attempted: string[] = []
) => {
  if (!isLocalOrigin(currentBaseUrl || API_BASE_URL)) {
    return null;
  }

  const currentOrigin = normalizeOrigin(currentBaseUrl || API_BASE_URL);

  return (
    LOCAL_API_CANDIDATES.find((candidate) => {
      const candidateOrigin = normalizeOrigin(candidate);
      return (
        !!candidateOrigin &&
        candidateOrigin !== currentOrigin &&
        !attempted.includes(candidateOrigin)
      );
    }) || null
  );
};

const getActiveApiBaseUrl = () => apiClient.defaults.baseURL || API_BASE_URL;

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// ============================================================
// REQUEST INTERCEPTOR - Attach JWT token
// ============================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from localStorage
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('access_token');
      
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR - Handle errors and token refresh
// ============================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _localApiFallbacks?: string[];
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Return successful response
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig;

    if (!error.response && originalRequest) {
      const attemptedFallbacks = originalRequest._localApiFallbacks || [];
      const fallbackBaseUrl = getNextLocalApiBaseUrl(
        originalRequest.baseURL,
        attemptedFallbacks
      );

      if (fallbackBaseUrl) {
        const fallbackOrigin = normalizeOrigin(fallbackBaseUrl);

        originalRequest._localApiFallbacks = fallbackOrigin
          ? [...attemptedFallbacks, fallbackOrigin]
          : attemptedFallbacks;
        originalRequest.baseURL = fallbackBaseUrl;
        apiClient.defaults.baseURL = fallbackBaseUrl;

        return apiClient(originalRequest);
      }
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('refresh_token') 
        : null;

      if (!refreshToken) {
        // No refresh token, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint
        const response = await axios.post(`${getActiveApiBaseUrl()}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data.data;

        // Store new access token
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access_token);
        }

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null);
        
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// ============================================================
// ERROR HANDLER UTILITY
// ============================================================

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    const responseData = axiosError.response?.data;
    
    // Check if response has error message
    if (
      responseData &&
      typeof responseData === 'object' &&
      'message' in responseData
    ) {
      return {
        message: String(responseData.message),
        statusCode: axiosError.response?.status,
      };
    }

    if (typeof responseData === 'string') {
      return {
        message:
          axiosError.response?.status === 404
            ? 'This feature is not available on the current backend.'
            : `Request failed with status ${axiosError.response?.status || 'unknown'}.`,
        statusCode: axiosError.response?.status,
      };
    }

    // Network error
    if (axiosError.message === 'Network Error') {
      return {
        message:
          'Backend is not reachable. Make sure the local API is running on localhost:5000.',
        statusCode: 0,
      };
    }

    // Timeout error
    if (axiosError.code === 'ECONNABORTED') {
      return {
        message: 'Request timeout. Please try again.',
        statusCode: 408,
      };
    }

    // Generic axios error
    return {
      message: axiosError.message || 'An error occurred',
      statusCode: axiosError.response?.status,
    };
  }

  // Unknown error
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    statusCode: 500,
  };
};

// ============================================================
// TYPED API RESPONSE HANDLER
// ============================================================

export const handleApiResponse = <T>(response: ApiResponse<T>): T => {
  if (response.success) {
    return response.data;
  }
  throw new Error(response.message || 'API request failed');
};

export default apiClient;
