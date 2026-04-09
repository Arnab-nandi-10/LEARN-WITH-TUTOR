const Payment = require("../../models/businesses/payment.model.js");
const { ApiError } = require("../../utils/ApiError.js");
const { ApiResponse } = require("../../utils/ApiResponce.js");
const { asyncHandler } = require("../../utils/asyncHandler.js");
const {
  applySuccessfulPaymentSideEffects,
} = require("../../utils/paymentLifecycle.utils.js");

const paymentDetailsQuery = () =>
  Payment.find().populate("student", "-password").populate("items.course");

const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await paymentDetailsQuery();

  return res
    .status(200)
    .json(
      new ApiResponse(200, transactions, "All transactions fetched successfully")
    );
});

const getTransactionDetails = asyncHandler(async (req, res) => {
  const transaction = await Payment.findById(req.params.paymentId)
    .populate("student", "-password")
    .populate("items.course");

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        transaction,
        "Transaction details fetched successfully"
      )
    );
});

const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (payment.status === "success") {
    throw new ApiError(400, "Payment already verified");
  }

  payment.status = "success";
  payment.paidAt = new Date();

  await payment.save();
  await applySuccessfulPaymentSideEffects(payment);

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment verified successfully"));
});

module.exports = {
  getAllTransactions,
  getTransactionDetails,
  verifyPayment,
};
