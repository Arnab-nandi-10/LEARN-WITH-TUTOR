import apiClient, { handleApiError } from './client';
import type {
  CheckoutQuote,
  Coupon,
  Course,
  CreatePaymentOrderInput,
  Payment,
  PaymentOrderResponse,
  Refund,
  RefundRules,
  User,
} from '../types';

const roleCollectionKeyMap = {
  admin: 'allAdmins',
  faculty: 'allFaculties',
  student: 'allStudents',
} as const;

type UserCollectionRole = keyof typeof roleCollectionKeyMap;

const normalizeCourse = (course: any): Course => {
  const facultyValue = course?.faculty_id;

  return {
    ...course,
    faculty_id:
      typeof facultyValue === 'string' ? facultyValue : facultyValue?._id || '',
  };
};

const normalizeCoupon = (coupon: any): Coupon => ({
  ...coupon,
  applicableCourses: Array.isArray(coupon?.applicableCourses)
    ? coupon.applicableCourses.map((courseId: any) =>
        typeof courseId === 'string' ? courseId : courseId?._id || ''
      )
    : [],
});

const normalizePayment = (payment: any): Payment => {
  const studentValue = payment.studentData || payment.student;
  const studentId =
    typeof studentValue === 'string' ? studentValue : studentValue?._id || '';

  const items = Array.isArray(payment.items)
    ? payment.items.map((item: any) => {
        const courseValue = item.courseData || item.course;

        if (typeof courseValue === 'string') {
          return { course: courseValue };
        }

        return {
          course: courseValue?._id || '',
          courseData: normalizeCourse(courseValue),
        };
      })
    : [];

  return {
    ...payment,
    student: studentId,
    studentData: typeof studentValue === 'string' ? undefined : studentValue,
    items,
  };
};

const normalizeRefund = (refund: any): Refund => {
  const studentValue = refund.studentData || refund.student;
  const courseValue = refund.courseData || refund.course;
  const paymentValue = refund.paymentData || refund.payment;

  return {
    ...refund,
    student: typeof studentValue === 'string' ? studentValue : studentValue?._id || '',
    studentData: typeof studentValue === 'string' ? undefined : studentValue,
    course: typeof courseValue === 'string' ? courseValue : courseValue?._id || '',
    courseData:
      typeof courseValue === 'string'
        ? undefined
        : (normalizeCourse(courseValue) as Refund['courseData']),
    payment: typeof paymentValue === 'string' ? paymentValue : paymentValue?._id || '',
    paymentData:
      typeof paymentValue === 'string' ? undefined : normalizePayment(paymentValue),
  };
};

const normalizeAdminPaymentList = (payments: any[]): Payment[] =>
  payments.map((payment) => normalizePayment(payment));

const normalizeAdminRefundList = (refunds: any[]): Refund[] =>
  refunds.map((refund) => normalizeRefund(refund));

const extractUsersFromCollection = (
  payload: Record<string, any>,
  role: UserCollectionRole
): User[] => {
  const key = roleCollectionKeyMap[role];
  return Array.isArray(payload?.[key]) ? payload[key] : [];
};

export const createPaymentOrder = async (
  payload: CreatePaymentOrderInput
): Promise<PaymentOrderResponse> => {
  try {
    const response = await apiClient.post('/api/payment/create-order', {
      type: payload.type || 'course',
      items: payload.items,
      couponCode: payload.couponCode,
    });

    return {
      ...response.data.data,
      payment: normalizePayment(response.data.data.payment),
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCheckoutQuote = async (
  payload: CreatePaymentOrderInput
): Promise<CheckoutQuote> => {
  try {
    const response = await apiClient.post('/api/payment/quote', {
      type: payload.type || 'course',
      items: payload.items,
      couponCode: payload.couponCode,
    });

    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const requestRefund = async (payload: {
  courseId: string;
  reason?: string;
}): Promise<Refund> => {
  try {
    const response = await apiClient.post('/api/refund/request', payload);
    return normalizeRefund(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAdminUsersByRole = async (
  role: UserCollectionRole,
  page = 1
): Promise<User[]> => {
  try {
    const rolePrefixMap = {
      admin: '/api/admin/users/all/a/user',
      faculty: '/api/admin/users/all/f/user',
      student: '/api/admin/users/all/s/user',
    } as const;

    const response = await apiClient.get(`${rolePrefixMap[role]}?page=${page}`);
    return extractUsersFromCollection(response.data.data, role);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAdminScopedUser = async (
  scope: 'admin' | 'faculty' | 'student',
  id: string
): Promise<User> => {
  try {
    const scopePrefixMap = {
      admin: '/api/admin/users/a/user',
      faculty: '/api/admin/users/f/user',
      student: '/api/admin/users/s/user',
    } as const;

    const response = await apiClient.get(`${scopePrefixMap[scope]}/${id}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCurrentAdminUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get('/api/admin/users/c/user');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const toggleUserVerification = async (
  userId: string
): Promise<{ is_verified: boolean }> => {
  try {
    const response = await apiClient.patch(`/api/admin/users/toggle/v/${userId}`);
    return {
      is_verified:
        response.data.data?.is_verified ?? response.data.data?.isVarified ?? false,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getApprovedCourses = async (): Promise<Course[]> => {
  try {
    const response = await apiClient.get('/api/admin/courses/all/approved');
    return Array.isArray(response.data.data)
      ? response.data.data.map((course: any) => normalizeCourse(course))
      : [];
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getRejectedCourses = async (): Promise<Course[]> => {
  try {
    const response = await apiClient.get('/api/admin/courses/all/rejected');
    return Array.isArray(response.data.data)
      ? response.data.data.map((course: any) => normalizeCourse(course))
      : [];
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getManagedCourseById = async (courseId: string): Promise<Course> => {
  try {
    const response = await apiClient.get(`/api/admin/courses/${courseId}`);
    return normalizeCourse(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const toggleCourseApproval = async (
  courseId: string
): Promise<{ isApproved: boolean }> => {
  try {
    const response = await apiClient.patch(`/api/admin/courses/toggle/${courseId}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateManagedCoursePrice = async (
  courseId: string,
  price: number
): Promise<{ price: number }> => {
  try {
    const response = await apiClient.patch(
      `/api/admin/courses/update/price/${courseId}`,
      { price }
    );
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteManagedCourse = async (courseId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/admin/courses/delete/${courseId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAllAdminPayments = async (): Promise<Payment[]> => {
  try {
    const response = await apiClient.get('/api/admin/all/payments');
    return normalizeAdminPaymentList(response.data.data || []);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAdminPaymentDetails = async (paymentId: string): Promise<Payment> => {
  try {
    const response = await apiClient.get(`/api/admin/payment/${paymentId}`);
    return normalizePayment(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const verifyAdminPayment = async (paymentId: string): Promise<Payment> => {
  try {
    const response = await apiClient.patch(`/api/admin/payment/verify/${paymentId}`);
    return normalizePayment(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getRefundRequests = async (): Promise<Refund[]> => {
  try {
    const response = await apiClient.get('/api/admin/refunds/all/refund-request');
    return normalizeAdminRefundList(response.data.data || []);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getRefundRules = async (): Promise<RefundRules | null> => {
  try {
    const response = await apiClient.get('/api/admin/refunds/rules');
    return response.data.data || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateRefundStatus = async (
  refundId: string,
  payload: { status: 'approved' | 'rejected'; remark?: string }
): Promise<Refund> => {
  try {
    const response = await apiClient.patch(
      `/api/admin/refunds/update/status/${refundId}`,
      payload
    );
    return normalizeRefund(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const processApprovedRefund = async (refundId: string): Promise<Refund> => {
  try {
    const response = await apiClient.post(`/api/refund/process/${refundId}`);
    return normalizeRefund(response.data.data?.refund);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const setRefundRules = async (
  payload: RefundRules
): Promise<RefundRules> => {
  try {
    const response = await apiClient.post('/api/admin/refunds/set/refund-rule', payload);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAllCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await apiClient.get('/api/admin/coupons');
    return Array.isArray(response.data.data)
      ? response.data.data.map((coupon: any) => normalizeCoupon(coupon))
      : [];
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createCoupon = async (payload: {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
  applicableCourses?: string[];
}): Promise<Coupon> => {
  try {
    const response = await apiClient.post('/api/admin/coupons', payload);
    return normalizeCoupon(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const toggleCouponStatus = async (couponId: string): Promise<Coupon> => {
  try {
    const response = await apiClient.patch(`/api/admin/coupons/${couponId}/toggle`);
    return normalizeCoupon(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteCoupon = async (couponId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/admin/coupons/${couponId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};
