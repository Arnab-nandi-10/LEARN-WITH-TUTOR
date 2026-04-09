const Course = require("../models/course_model.js");
const Payment = require("../models/businesses/payment.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponce.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const {
  generateChecksum,
  verifyChecksum,
} = require("../services/paytm.service.js");
const {
  applySuccessfulPaymentSideEffects,
} = require("../utils/paymentLifecycle.utils.js");
const {
  assertPurchasableCourse,
  calculateCheckoutBreakdown,
  validateCouponForCourses,
} = require("../utils/checkout.utils.js");

const getFrontendBaseUrl = () =>
  process.env.FRONTEND_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3001";

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "At least one payment item is required");
  }

  return items.map((item) => {
    const courseId = typeof item === "string" ? item : item?.course;

    if (!courseId) {
      throw new ApiError(400, "Each payment item must include a course");
    }

    return { course: courseId };
  });
};

const resolveCheckout = async ({ items, couponCode }) => {
  const courses = [];

  for (const item of items) {
    const course = await Course.findById(item.course);

    assertPurchasableCourse(course);
    courses.push(course);
  }

  const subtotal = courses.reduce((sum, course) => sum + (course.price || 0), 0);
  const { coupon, discountAmount, appliedCoupon } = await validateCouponForCourses(
    couponCode,
    courses
  );
  const breakdown = calculateCheckoutBreakdown(subtotal, discountAmount);

  return {
    courses,
    coupon,
    breakdown,
    appliedCoupon,
  };
};

const quoteOrder = asyncHandler(async (req, res) => {
  const items = normalizeItems(req.body.items);
  const { breakdown, appliedCoupon } = await resolveCheckout({
    items,
    couponCode: req.body.couponCode,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        breakdown,
        coupon: appliedCoupon,
      },
      "Checkout quote generated successfully"
    )
  );
});

const createOrder = asyncHandler(async (req, res) => {
  const items = normalizeItems(req.body.items);
  const type = req.body.type || "course";
  const { breakdown, coupon, appliedCoupon } = await resolveCheckout({
    items,
    couponCode: req.body.couponCode,
  });
  const totalAmount = breakdown.total;

  const orderId = `ORDER_${Date.now()}`;

  const payment = await Payment.create({
    student: req.user.id,
    items,
    type,
    amount: totalAmount,
    orderId,
    breakdown,
    coupon: appliedCoupon
      ? {
          couponId: coupon?._id,
          ...appliedCoupon,
        }
      : undefined,
  });

  const paytmParams = {
    MID: process.env.PAYTM_MID,
    WEBSITE: "WEBSTAGING",
    INDUSTRY_TYPE_ID: "Retail",
    CHANNEL_ID: "WEB",
    ORDER_ID: orderId,
    CUST_ID: String(req.user.id),
    TXN_AMOUNT: totalAmount.toString(),
    CALLBACK_URL: `${
      process.env.BASE_URL || "http://localhost:5000"
    }/api/payment/verify`,
  };

  const checksum = await generateChecksum(paytmParams);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payment,
        paytmParams,
        checksum,
        breakdown,
        coupon: appliedCoupon,
      },
      "Order generated"
    )
  );
});

const verifyPaymentController = asyncHandler(async (req, res) => {
  const { CHECKSUMHASH, ...paytmResponse } = req.body;

  if (!CHECKSUMHASH) {
    throw new ApiError(400, "Checksum missing");
  }

  const isValid = await verifyChecksum(paytmResponse, CHECKSUMHASH);

  if (!isValid) {
    throw new ApiError(400, "Checksum mismatch");
  }

  const payment = await Payment.findOne({
    orderId: paytmResponse.ORDER_ID || paytmResponse.ORDERID,
  });

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  const status = paytmResponse.STATUS;

  if (status === "TXN_SUCCESS") {
    const firstSuccessfulVerification = payment.status !== "success";

    payment.status = "success";
    payment.transactionId = paytmResponse.TXNID;
    payment.paidAt = payment.paidAt || new Date();
    await payment.save();

    if (firstSuccessfulVerification) {
      await applySuccessfulPaymentSideEffects(payment);
    }
  } else {
    payment.status = "failed";
    await payment.save();
  }

  const redirectUrl = new URL(
    `${getFrontendBaseUrl()}/payment-status`
  );

  redirectUrl.searchParams.set(
    "status",
    payment.status === "success" ? "success" : "failed"
  );
  redirectUrl.searchParams.set("orderId", payment.orderId);

  if (payment.transactionId) {
    redirectUrl.searchParams.set("txnId", payment.transactionId);
  }

  return res.redirect(redirectUrl.toString());
});

module.exports = {
  quoteOrder,
  createOrder,
  verifyPayment: verifyPaymentController,
};
