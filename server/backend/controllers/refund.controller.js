const Attempt = require("../models/attempt_model.js");
const Exam = require("../models/exam_model.js");
const Payment = require("../models/businesses/payment.model.js");
const Refund = require("../models/businesses/refund.model.js");
const RefundRules = require("../models/businesses/refundRules.model.js");
const { get_course_progress } = require("../services/progress_service.js");
const { initiateRefund } = require("../services/paytm.service.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponce.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { checkRefundEligibility } = require("../utils/refund.utils.js");

const requestRefund = asyncHandler(async (req, res) => {
  const { courseId, reason } = req.body;

  if (!courseId) {
    throw new ApiError(400, "courseId is required");
  }

  const payment = await Payment.findOne({
    student: req.user.id,
    "items.course": courseId,
    status: "success",
  }).sort({ createdAt: -1 });

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  const existing = await Refund.findOne({
    student: req.user.id,
    course: courseId,
  });

  if (existing) {
    throw new ApiError(400, "Refund already requested");
  }

  const { percentage } = await get_course_progress(courseId, req.user);
  const exam = await Exam.findOne({ course_id: courseId }).sort({ createdAt: -1 });

  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  const result = await Attempt.findOne({
    user_id: req.user.id,
    exam_id: exam._id,
  }).sort({ createdAt: -1 });

  if (!result) {
    throw new ApiError(404, "Result not found");
  }

  const rules = await RefundRules.findOne();

  if (!rules) {
    throw new ApiError(400, "Refund rules are not configured");
  }

  const cheatingFlag = false;
  const examScore = result.score;
  const eligible = checkRefundEligibility({
    completion: percentage,
    score: examScore,
    cheatingFlag,
    purchaseDate: payment.createdAt,
    rules,
  });

  const refund = await Refund.create({
    student: req.user.id,
    course: courseId,
    payment: payment._id,
    completionPercentage: percentage,
    examScore,
    cheatingFlag,
    eligible,
    reason,
  });

  payment.refundStatus = "requested";
  await payment.save();

  return res
    .status(201)
    .json(new ApiResponse(201, refund, "Refund request submitted"));
});

const processRefund = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  const refund = await Refund.findById(refundId).populate("payment");

  if (!refund || refund.status !== "approved") {
    throw new ApiError(400, "Invalid refund");
  }

  const response = await initiateRefund({
    orderId: refund.payment.orderId,
    txnId: refund.payment.transactionId,
    amount: refund.refundAmount || refund.payment.amount,
    refundId: refund._id.toString(),
  });

  const resultStatus =
    response?.body?.resultInfo?.resultStatus || response?.resultInfo?.resultStatus;

  if (resultStatus !== "SUCCESS") {
    throw new ApiError(400, "Refund failed from Paytm");
  }

  refund.status = "processed";
  refund.payment.refundStatus = "processed";
  await refund.payment.save();
  await refund.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { paytmResponse: response, refund },
      "Refund processed successfully"
    )
  );
});

module.exports = {
  requestRefund,
  processRefund,
};
