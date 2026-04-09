const Coupon = require("../models/businesses/coupon.model.js");
const Enrollment = require("../models/enrollment_model.js");

const ensureEnrollmentsForPayment = async (payment) => {
  for (const item of payment.items || []) {
    const existingEnrollment = await Enrollment.findOne({
      user_id: payment.student,
      course_id: item.course,
    });

    if (!existingEnrollment) {
      await Enrollment.create({
        user_id: payment.student,
        course_id: item.course,
        enrolled_at: new Date(),
      });
    }
  }
};

const incrementCouponUsageForPayment = async (payment) => {
  const couponId = payment?.coupon?.couponId;

  if (!couponId) {
    return;
  }

  await Coupon.findByIdAndUpdate(couponId, {
    $inc: {
      usedCount: 1,
    },
  }).catch(() => null);
};

const applySuccessfulPaymentSideEffects = async (payment) => {
  await ensureEnrollmentsForPayment(payment);
  await incrementCouponUsageForPayment(payment);
};

module.exports = {
  applySuccessfulPaymentSideEffects,
  ensureEnrollmentsForPayment,
  incrementCouponUsageForPayment,
};
