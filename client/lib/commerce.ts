import type { Course } from './types';

const parseEnvNumber = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const checkoutConfig = {
  merchantName:
    process.env.NEXT_PUBLIC_MERCHANT_NAME || 'Tutor Labs',
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@tutorlabs.com',
  gatewayName:
    process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_NAME || 'Paytm',
  taxRate: parseEnvNumber(process.env.NEXT_PUBLIC_CHECKOUT_TAX_RATE),
  platformFeeRate: parseEnvNumber(
    process.env.NEXT_PUBLIC_CHECKOUT_PLATFORM_FEE_RATE
  ),
  platformFeeFlat: parseEnvNumber(
    process.env.NEXT_PUBLIC_CHECKOUT_PLATFORM_FEE_FLAT
  ),
  paytmEnvironment: process.env.NEXT_PUBLIC_PAYTM_ENV || 'staging',
  paytmActionUrl:
    process.env.NEXT_PUBLIC_PAYTM_ACTION_URL ||
    (process.env.NEXT_PUBLIC_PAYTM_ENV === 'production'
      ? 'https://securegw.paytm.in/order/process'
      : 'https://securegw-stage.paytm.in/order/process'),
};

export const formatCurrency = (value: number): string => {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
};

export const calculateCheckoutBreakdown = (
  coursePrice: number,
  discountAmount = 0
) => {
  const subtotal = Math.max(coursePrice, 0);
  if (subtotal <= 0) {
    return {
      subtotal: 0,
      platformFee: 0,
      taxAmount: 0,
      totalBeforeDiscount: 0,
      total: 0,
      discountAmount: 0,
    };
  }
  const platformFee =
    subtotal * checkoutConfig.platformFeeRate + checkoutConfig.platformFeeFlat;
  const taxableAmount = subtotal + platformFee;
  const taxAmount = taxableAmount * checkoutConfig.taxRate;
  const totalBeforeDiscount = taxableAmount + taxAmount;
  const total = Math.max(totalBeforeDiscount - Math.max(discountAmount, 0), 0);

  return {
    subtotal,
    platformFee,
    taxAmount,
    totalBeforeDiscount,
    total,
    discountAmount: Math.max(discountAmount, 0),
  };
};

export const getCheckoutHighlights = (course: Course) => {
  return [
    {
      title: `${Math.max(course.total_modules, 1)}-module learning path`,
      detail: 'Structured roadmap with guided milestones',
    },
    {
      title:
        course.price > 0 ? 'Performance-based refund model' : 'Instant free access',
      detail:
        course.price > 0
          ? 'Eligibility depends on the active admin refund rules'
          : 'Start learning immediately with zero checkout friction',
    },
    {
      title: 'Secure account-linked access',
      detail: 'Purchases are tied to your signed-in learner profile',
    },
  ];
};
