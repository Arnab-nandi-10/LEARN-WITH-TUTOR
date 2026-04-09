const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    completionPercentage: {
      type: Number,
      required: true,
    },
    examScore: {
      type: Number,
      required: true,
    },
    cheatingFlag: {
      type: Boolean,
      default: false,
    },
    eligible: {
      type: Boolean,
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "processed"],
      default: "requested",
    },
    refundAmount: Number,
    reason: String,
    adminRemark: String,
    processedAt: Date,
  },
  { timestamps: true }
);

refundSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Refund", refundSchema);
