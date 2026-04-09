import { toast } from 'sonner';
import type { ApiError } from '../types';

// ============================================================
// ERROR HANDLER UTILITIES
// ============================================================

export interface ErrorHandlerOptions {
  showToast?: boolean;
  showConsole?: boolean;
  fallbackMessage?: string;
}

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }

  return 'An unexpected error occurred';
};

/**
 * Check if error is an API error
 */
export const isApiError = (error: unknown): error is ApiError => {
  if (!error || typeof error !== 'object') return false;
  return 'message' in error && ('statusCode' in error || 'code' in error);
};

/**
 * Get HTTP status description
 */
export const getStatusDescription = (statusCode?: number): string => {
  const descriptions: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'Request timeout. Please try again.',
    409: 'Conflict: This resource already exists.',
    422: 'Invalid data provided. Please check your input.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. Please try again later.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again later.',
  };

  return descriptions[statusCode || 500] || 'An error occurred';
};

/**
 * Handle and display API errors
 */
export const handleApiErrorDisplay = (
  error: unknown,
  options: ErrorHandlerOptions = {}
): void => {
  const {
    showToast = true,
    showConsole = true,
    fallbackMessage = 'Something went wrong. Please try again.',
  } = options;

  let message = fallbackMessage;

  if (showConsole) {
    console.error('API Error:', error);
  }

  if (isApiError(error)) {
    // If we have a custom message from API, use it
    if (error.message && error.message !== fallbackMessage) {
      message = error.message;
    } else if (error.statusCode) {
      // Otherwise use status description
      message = getStatusDescription(error.statusCode);
    }
  } else {
    message = getErrorMessage(error);
  }

  if (showToast) {
    toast.error(message);
  }
};

/**
 * Handle and display success messages
 */
export const showSuccessToast = (message: string): void => {
  toast.success(message);
};

/**
 * Handle and display info messages
 */
export const showInfoToast = (message: string): void => {
  toast.info(message);
};

/**
 * Handle and display warning messages
 */
export const showWarningToast = (message: string): void => {
  toast.warning(message);
};

/**
 * Show loading toast (returns promise to delete)
 */
export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

/**
 * Update or replace an existing toast
 */
export const updateToast = (id: string | number, options: Parameters<typeof toast>[1] & { message?: string }) => {
  const { message, ...toastOptions } = options;
  if (message) {
    toast(message, { id, ...toastOptions } as any);
  } else {
    toast.dismiss(id);
  }
};

/**
 * Validate form input
 */
export const getValidationError = (fieldName: string, error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    if ('message' in error) {
      return (error as { message: string }).message;
    }
  }

  return `${fieldName} is invalid`;
};

/**
 * Format network error
 */
export const formatNetworkError = (): string => {
  return 'Network error. Please check your internet connection.';
};

/**
 * Format timeout error
 */
export const formatTimeoutError = (): string => {
  return 'Request timed out. Please try again.';
};
