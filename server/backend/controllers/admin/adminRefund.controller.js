const Refund = require("../../models/businesses/refund.model.js");
const RefundRules = require("../../models/businesses/refundRules.model.js");
const { ApiError } = require("../../utils/ApiError.js");
const { ApiResponse } = require("../../utils/ApiResponce.js");
const { asyncHandler } = require("../../utils/asyncHandler.js");
const { calculateRefundAmount } = require("../../utils/refund.utils.js");

const getAllRefundRequests = asyncHandler(async (req, res) => {
  const refunds = await Refund.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "faculty_id",
              foreignField: "_id",
              as: "faculty",
            },
          },
          {
            $unwind: "$faculty",
          },
        ],
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "payment",
      },
    },
    {
      $unwind: "$student",
    },
    {
      $unwind: "$course",
    },
    {
      $unwind: {
        path: "$payment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        "student.password": 0,
        "course.faculty.password": 0,
        "payment.student": 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, refunds, "Refund requests fetched successfully")
  );
});

const getRefundRules = asyncHandler(async (req, res) => {
  const rules = await RefundRules.findOne();

  return res
    .status(200)
    .json(new ApiResponse(200, rules, "Refund rules fetched successfully"));
});

const updateRefundStatus = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  const { status, remark } = req.body;

  const refund = await Refund.findById(refundId).populate("payment course");

  if (!refund) {
    throw new ApiError(404, "Refund not found");
  }

  if (status === "approved") {
    const rules = await RefundRules.findOne();

    if (!rules) {
      throw new ApiError(400, "Refund rules are not configured");
    }

    const amount = calculateRefundAmount(
      refund.examScore,
      refund.payment.amount,
      rules.tiers
    );

    refund.refundAmount = amount;
    refund.status = "approved";
    refund.payment.refundStatus = "approved";
    await refund.payment.save();
  } else {
    refund.status = "rejected";
    if (refund.payment) {
      refund.payment.refundStatus = "rejected";
      await refund.payment.save();
    }
  }

  refund.adminRemark = remark;
  refund.processedAt = new Date();

  await refund.save();

  return res
    .status(200)
    .json(new ApiResponse(200, refund, "Refund updated successfully"));
});

const setRefundRules = asyncHandler(async (req, res) => {
  const { minCompletion, minScore, timeLimitDays, tiers } = req.body;

  if (
    minCompletion === undefined ||
    minScore === undefined ||
    timeLimitDays === undefined
  ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const rules = await RefundRules.findOneAndUpdate(
    {},
    {
      minCompletion,
      minScore,
      timeLimitDays,
      tiers,
    },
    {
      new: true,
      upsert: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, rules, "Refund rules set successfully"));
});

module.exports = {
  getAllRefundRequests,
  getRefundRules,
  updateRefundStatus,
  setRefundRules,
};
