const Coupon = require("../models/businesses/coupon.model.js");
const { ApiError } = require("./ApiError.js");

const readNumber = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const roundCurrency = (value) => Math.max(Math.round(value), 0);

const getCheckoutConfig = () => ({
  taxRate: readNumber(
    process.env.CHECKOUT_TAX_RATE,
    process.env.NEXT_PUBLIC_CHECKOUT_TAX_RATE
  ),
  platformFeeRate: readNumber(
    process.env.CHECKOUT_PLATFORM_FEE_RATE,
    process.env.NEXT_PUBLIC_CHECKOUT_PLATFORM_FEE_RATE
  ),
  platformFeeFlat: readNumber(
    process.env.CHECKOUT_PLATFORM_FEE_FLAT,
    process.env.NEXT_PUBLIC_CHECKOUT_PLATFORM_FEE_FLAT
  ),
});

const calculateCheckoutBreakdown = (coursePrice, discountAmount = 0) => {
  const config = getCheckoutConfig();
  const subtotal = roundCurrency(coursePrice);
  if (subtotal <= 0) {
    return {
      subtotal: 0,
      platformFee: 0,
      taxAmount: 0,
      totalBeforeDiscount: 0,
      discountAmount: 0,
      total: 0,
    };
  }
  const platformFee = roundCurrency(
    subtotal * config.platformFeeRate + config.platformFeeFlat
  );
  const taxableAmount = subtotal + platformFee;
  const taxAmount = roundCurrency(taxableAmount * config.taxRate);
  const totalBeforeDiscount = taxableAmount + taxAmount;
  const safeDiscount = roundCurrency(Math.min(discountAmount, totalBeforeDiscount));
  const total = Math.max(totalBeforeDiscount - safeDiscount, 0);

  return {
    subtotal,
    platformFee,
    taxAmount,
    totalBeforeDiscount,
    discountAmount: safeDiscount,
    total,
  };
};

const assertPurchasableCourse = (course) => {
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.status !== "published" || course.isApproved === false) {
    throw new ApiError(403, "Course is not available for purchase");
  }
};

const getEligibleSubtotal = (coupon, courses) => {
  if (!Array.isArray(coupon.applicableCourses) || coupon.applicableCourses.length === 0) {
    return courses.reduce((sum, course) => sum + (course.price || 0), 0);
  }

  const applicableCourseIds = new Set(
    coupon.applicableCourses.map((courseId) => courseId.toString())
  );
  const eligibleCourses = courses.filter((course) =>
    applicableCourseIds.has(course._id.toString())
  );

  if (eligibleCourses.length === 0) {
    throw new ApiError(400, "Coupon is not valid for the selected course");
  }

  return eligibleCourses.reduce((sum, course) => sum + (course.price || 0), 0);
};

const validateCouponForCourses = async (couponCode, courses) => {
  if (!couponCode) {
    return {
      coupon: null,
      discountAmount: 0,
      appliedCoupon: null,
    };
  }

  const normalizedCode = couponCode.trim().toUpperCase();

  if (!normalizedCode) {
    return {
      coupon: null,
      discountAmount: 0,
      appliedCoupon: null,
    };
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  if (!coupon.active) {
    throw new ApiError(400, "Coupon is inactive");
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    throw new ApiError(400, "Coupon has expired");
  }

  if (
    typeof coupon.usageLimit === "number" &&
    coupon.usageLimit > 0 &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    throw new ApiError(400, "Coupon usage limit has been reached");
  }

  const subtotal = courses.reduce((sum, course) => sum + (course.price || 0), 0);

  if (subtotal < (coupon.minOrderAmount || 0)) {
    throw new ApiError(
      400,
      `Coupon requires a minimum order of ${coupon.minOrderAmount}`
    );
  }

  const eligibleSubtotal = getEligibleSubtotal(coupon, courses);
  let discountAmount =
    coupon.discountType === "percent"
      ? (eligibleSubtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  }

  discountAmount = roundCurrency(Math.min(discountAmount, subtotal));

  return {
    coupon,
    discountAmount,
    appliedCoupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || undefined,
    },
  };
};

module.exports = {
  calculateCheckoutBreakdown,
  assertPurchasableCourse,
  validateCouponForCourses,
  getCheckoutConfig,
};
