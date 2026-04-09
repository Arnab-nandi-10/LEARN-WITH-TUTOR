import { z } from 'zod';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Signup validation schema
 */
export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'faculty', 'admin']),
});

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Course form validation schema
 */
export const courseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters'),
  category: z
    .string()
    .min(1, 'Category is required'),
  price: z
    .number()
    .min(0, 'Price must be 0 or greater')
    .optional(),
  thumbnail_url: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal('')),
});

export type CourseFormData = z.infer<typeof courseSchema>;

/**
 * Module form validation schema
 */
export const moduleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters'),
});

export type ModuleFormData = z.infer<typeof moduleSchema>;

/**
 * Lesson form validation schema
 */
export const lessonSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters'),
  type: z.enum(['video', 'text', 'file']),
  content_url: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal('')),
  content_text: z
    .string()
    .optional(),
  duration: z
    .number()
    .min(0, 'Duration must be 0 or greater')
    .optional(),
  is_preview: z
    .boolean()
    .optional(),
});

export type LessonFormData = z.infer<typeof lessonSchema>;
