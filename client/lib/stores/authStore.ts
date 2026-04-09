import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, SignupCredentials } from '../types';
import * as authApi from '../api/auth';
import * as attemptsApi from '../api/attempts';
import { clearMyEnrollmentsCache } from '../api/enrollments';
import { clearCourseProgressCache } from '../api/progress';

const getStoredToken = (key: 'access_token' | 'refresh_token'): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
};

// ============================================================
// AUTH STORE STATE TYPE
// ============================================================

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (credentials: SignupCredentials) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  checkAuth: () => Promise<boolean>;
}

// ============================================================
// AUTH STORE
// ============================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      hasHydrated: false,

      // ========================================================
      // HYDRATION FLAG
      // ========================================================
      setHasHydrated: (hasHydrated: boolean) => {
        set({ hasHydrated });
      },

      // ========================================================
      // LOGIN
      // ========================================================
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(credentials);
          const { user, access_token, refresh_token } = response;

          // Store tokens in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
          }

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isLoading: false,
            error: null,
          });

          return user;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          throw error;
        }
      },

      // ========================================================
      // SIGNUP
      // ========================================================
      signup: async (credentials: SignupCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.signup(credentials);
          const { user, access_token, refresh_token } = response;

          // Store tokens in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
          }

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isLoading: false,
            error: null,
          });

          return user;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Signup failed',
          });
          throw error;
        }
      },

      // ========================================================
      // LOGOUT
      // ========================================================
      logout: async () => {
        const refreshToken = get().refreshToken || getStoredToken('refresh_token');
        
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear tokens from localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
          }

          attemptsApi.clearAttemptResultCache();
          clearMyEnrollmentsCache();
          clearCourseProgressCache();

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,
          });
        }
      },

      // ========================================================
      // SET USER
      // ========================================================
      setUser: (user: User | null) => {
        set({ user });
      },

      // ========================================================
      // SET TOKENS
      // ========================================================
      setTokens: (accessToken: string, refreshToken: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        }

        set({ accessToken, refreshToken });
      },

      // ========================================================
      // CLEAR AUTH
      // ========================================================
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }

        attemptsApi.clearAttemptResultCache();
        clearMyEnrollmentsCache();
        clearCourseProgressCache();

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: null,
          hasHydrated: true,
        });
      },

      // ========================================================
      // CHECK AUTH - Validate if user is still authenticated
      // ========================================================
      checkAuth: async () => {
        const accessToken = get().accessToken || getStoredToken('access_token');
        const refreshToken = get().refreshToken || getStoredToken('refresh_token');

        if (!accessToken || !refreshToken) {
          get().clearAuth();
          return false;
        }

        set({
          isLoading: true,
          error: null,
          accessToken,
          refreshToken,
        });

        try {
          const user = await authApi.getCurrentUser();
          set({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error: any) {
          get().clearAuth();
          set({
            isLoading: false,
            error: error?.message || 'Authentication failed',
          });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // Key in localStorage
      partialize: (state) => ({
        user: state.user,
        // Don't persist tokens in zustand - they're in localStorage
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHasHydrated(true);
        }
      },
    }
  )
);

// ============================================================
// HOOKS FOR EASIER ACCESS
// ============================================================

export const useAuth = () => {
  const {
    user,
    isLoading,
    error,
    hasHydrated,
    login,
    signup,
    logout,
    checkAuth,
  } = useAuthStore();

  const isAuthenticated = !!user;
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    isLoading,
    error,
    hasHydrated,
    isAuthenticated,
    isStudent,
    isFaculty,
    isAdmin,
    login,
    signup,
    logout,
    checkAuth,
  };
};
