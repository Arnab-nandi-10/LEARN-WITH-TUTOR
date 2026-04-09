const express = require("express");
const {
  requestRefund,
  processRefund,
} = require("../controllers/refund.controller.js");
const { protect } = require("../middlewares/auth_middleware.js");
const { restrict_to } = require("../middlewares/role_middleware.js");

const router = express.Router();

router.route("/request").post(protect, requestRefund);
router
  .route("/process/:refundId")
  .post(protect, restrict_to("admin"), processRefund);

module.exports = router;
