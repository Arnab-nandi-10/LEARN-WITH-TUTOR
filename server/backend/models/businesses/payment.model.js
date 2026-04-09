const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
      },
    ],
    type: {
      type: String,
      enum: ["course", "bundle"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    transactionId: String,
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    refundStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "processed"],
      default: "none",
    },
    breakdown: {
      subtotal: {
        type: Number,
        default: 0,
      },
      platformFee: {
        type: Number,
        default: 0,
      },
      taxAmount: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      totalBeforeDiscount: {
        type: Number,
        default: 0,
      },
    },
    coupon: {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
      code: String,
      discountType: {
        type: String,
        enum: ["percent", "fixed"],
      },
      discountValue: Number,
      discountAmount: Number,
      maxDiscountAmount: Number,
    },
    paidAt: Date,
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
