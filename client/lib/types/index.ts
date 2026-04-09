// ============================================================
// USER TYPES
// ============================================================

export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// COURSE TYPES
// ============================================================

export type CourseStatus = 'draft' | 'published';

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  price: number;
  faculty_id: string;
  status: CourseStatus;
  isApproved?: boolean;
  total_modules: number;
  total_duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFormData {
  title: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  price?: number;
}

// ============================================================
// MODULE TYPES
// ============================================================

export interface Module {
  _id: string;
  course_id: string;
  title: string;
  description?: string;
  order: number;
  total_lessons: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface ModuleFormData {
  title: string;
  description?: string;
}

export interface ModuleReorderData {
  modules: Array<{
    id: string;
    order: number;
  }>;
}

// ============================================================
// LESSON TYPES
// ============================================================

export type LessonType = 'video' | 'text' | 'file';

export interface Lesson {
  _id: string;
  module_id: string;
  title: string;
  content_type?: LessonType;
  type: LessonType;
  content_url?: string;
  content_text?: string;
  content?: string;
  video_url?: string;
  file_url?: string;
  order: number;
  duration: number;
  is_preview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonFormData {
  title: string;
  type: LessonType;
  content_url?: string;
  content_text?: string;
  duration?: number;
  is_preview?: boolean;
}

export interface LessonReorderData {
  lessons: Array<{
    id: string;
    order: number;
  }>;
}

// ============================================================
// ENROLLMENT TYPES
// ============================================================

export type EnrollmentStatus = 'active' | 'completed';

export interface Enrollment {
  _id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

// ============================================================
// PROGRESS TYPES
// ============================================================

export interface Progress {
  _id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  lesson_id: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// FULL COURSE TYPES (with nested data)
// ============================================================

export interface FullCourse {
  course: Course;
  modules: ModuleWithLessons[];
  access_mode?: 'full' | 'preview';
}

// Extended course type with nested modules and lessons
export interface CourseWithDetails extends Course {
  modules?: ModuleWithLessons[];
}

// ============================================================
// AUTHENTICATION TYPES
// ============================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================
// PAGINATION TYPES
// ============================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// SEARCH & FILTER TYPES
// ============================================================

export interface CourseFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: CourseStatus;
  search?: string;
}

// ============================================================
// ERROR TYPES
// ============================================================

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

export interface MessageResponse {
  message: string;
}

// ============================================================
// UTILITY TYPES
// ============================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================
// EXAM & ASSESSMENT TYPES
// ============================================================

export interface Exam {
  _id: string;
  course_id: string;
  module_id?: string | null;
  title: string;
  description?: string;
  total_marks: number;
  time_limit?: number;
  passing_marks: number;
  duration_minutes?: number;
  is_active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamFormData {
  title: string;
  description?: string;
  course_id: string;
  module_id?: string;
  total_marks?: number;
  time_limit?: number;
  passing_marks?: number;
  duration_minutes?: number;
  questions?: QuestionFormData[];
}

export interface QuestionOption {
  text: string;
}

export type QuestionOptionInput = QuestionOption | string;

export interface Question {
  _id: string;
  exam_id?: string;
  question_text: string;
  options: QuestionOption[];
  correct_answer?: number;
  marks: number;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionFormData {
  exam_id: string;
  question_text: string;
  options: QuestionOptionInput[];
  correct_answer: number;
  marks: number;
}

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

// ============================================================
// EXAM ATTEMPT TYPES
// ============================================================

export interface ExamAttempt {
  _id: string;
  user_id: string;
  exam_id: string;
  answers: Array<{
    question_id: string;
    selected_option: number;
  }>;
  score: number;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'completed';
}

export interface AttemptSubmitData {
  answers: Array<{
    question_id: string;
    selected_option: number;
  }>;
}

export interface AttemptResult {
  score: number;
  total: number;
  passed: boolean;
  submitted_at?: string;
}

export type ExamAvailability = 'locked' | 'available' | 'completed';

export interface CourseExamSummary {
  exam: Exam;
  label: string;
  availability: ExamAvailability;
  requiredCompletionPercentage: number;
  currentCompletionPercentage: number;
}

// ============================================================
// PROGRESS & ANALYTICS TYPES
// ============================================================

export interface CourseProgressSummary {
  completed: number;
  total: number;
  percentage: number;
  course_id?: string;
  total_lessons?: number;
  completed_lessons?: number;
  completion_percentage?: number;
  total_time_spent_minutes?: number;
  last_accessed?: string;
}

export interface Analytics {
  total_students: number;
  total_progress_records: number;
  total_attempts: number;
  totalStudents?: number;
  totalProgressRecords?: number;
  totalAttempts?: number;
}

// ============================================================
// BUSINESS / COMMERCE TYPES
// ============================================================

export type PaymentType = 'course' | 'bundle';
export type PaymentStatus = 'pending' | 'success' | 'failed';
export type RefundStatus = 'requested' | 'approved' | 'rejected' | 'processed';
export type CouponDiscountType = 'percent' | 'fixed';

export interface PaymentItem {
  course: string;
  courseData?: Course;
}

export interface CheckoutBreakdown {
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  totalBeforeDiscount: number;
  discountAmount: number;
  total: number;
}

export interface AppliedCoupon {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
  maxDiscountAmount?: number;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  usageLimit?: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
  applicableCourses?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  student: string;
  items: PaymentItem[];
  type: PaymentType;
  amount: number;
  orderId: string;
  transactionId?: string;
  status: PaymentStatus;
  refundStatus?: 'none' | RefundStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  studentData?: User;
  breakdown?: CheckoutBreakdown;
  coupon?: AppliedCoupon;
}

export interface CreatePaymentOrderInput {
  items: Array<{
    course: string;
  }>;
  type?: PaymentType;
  couponCode?: string;
}

export interface PaymentOrderResponse {
  payment: Payment;
  paytmParams: Record<string, string>;
  checksum: string;
  breakdown?: CheckoutBreakdown;
  coupon?: AppliedCoupon | null;
}

export interface CheckoutQuote {
  breakdown: CheckoutBreakdown;
  coupon?: AppliedCoupon | null;
}

export interface RefundTier {
  minScore: number;
  refundPercent: number;
}

export interface RefundRules {
  _id?: string;
  minCompletion: number;
  minScore: number;
  timeLimitDays: number;
  tiers: RefundTier[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Refund {
  _id: string;
  student: string;
  course: string;
  payment: string;
  completionPercentage: number;
  examScore: number;
  cheatingFlag: boolean;
  eligible: boolean;
  status: RefundStatus;
  refundAmount?: number;
  reason?: string;
  adminRemark?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  studentData?: User;
  courseData?: Course & {
    faculty?: User;
  };
  paymentData?: Payment;
}
