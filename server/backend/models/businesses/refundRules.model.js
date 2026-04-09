const mongoose = require("mongoose");

const tierSchema = new mongoose.Schema(
  {
    minScore: Number,
    refundPercent: Number,
  },
  { _id: false }
);

const refundRulesSchema = new mongoose.Schema(
  {
    minCompletion: Number,
    minScore: Number,
    timeLimitDays: Number,
    tiers: [tierSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RefundRules", refundRulesSchema);
