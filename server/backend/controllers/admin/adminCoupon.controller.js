const Coupon = require("../../models/businesses/coupon.model.js");
const { ApiError } = require("../../utils/ApiError.js");
const { ApiResponse } = require("../../utils/ApiResponce.js");
const { asyncHandler } = require("../../utils/asyncHandler.js");

const sanitizeCoupon = (coupon) => ({
  ...coupon.toObject(),
  applicableCourses: Array.isArray(coupon.applicableCourses)
    ? coupon.applicableCourses.map((courseId) => courseId.toString())
    : [],
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        coupons.map((coupon) => sanitizeCoupon(coupon)),
        "Coupons fetched successfully"
      )
    );
});

const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    usageLimit,
    expiresAt,
    applicableCourses,
  } = req.body;

  if (!code || !discountType || discountValue === undefined) {
    throw new ApiError(400, "code, discountType and discountValue are required");
  }

  if (Number(discountValue) <= 0) {
    throw new ApiError(400, "discountValue must be greater than zero");
  }

  if (discountType === "percent" && Number(discountValue) > 100) {
    throw new ApiError(400, "Percent discounts can not exceed 100");
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    discountType,
    discountValue,
    maxDiscountAmount:
      maxDiscountAmount === "" || maxDiscountAmount === null
        ? null
        : maxDiscountAmount,
    minOrderAmount: minOrderAmount || 0,
    usageLimit:
      usageLimit === "" || usageLimit === null || usageLimit === undefined
        ? null
        : usageLimit,
    expiresAt: expiresAt || null,
    applicableCourses: Array.isArray(applicableCourses) ? applicableCourses : [],
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        sanitizeCoupon(coupon),
        "Coupon created successfully"
      )
    );
});

const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.couponId);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  coupon.active = !coupon.active;
  await coupon.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        sanitizeCoupon(coupon),
        `Coupon ${coupon.active ? "activated" : "deactivated"} successfully`
      )
    );
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.couponId);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Coupon deleted successfully"));
});

module.exports = {
  getAllCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
};
