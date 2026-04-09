const express = require("express");
const {
  getAllRefundRequests,
  getRefundRules,
  updateRefundStatus,
  setRefundRules,
} = require("../../controllers/admin/adminRefund.controller.js");
const { protect } = require("../../middlewares/auth_middleware.js");
const { restrict_to } = require("../../middlewares/role_middleware.js");

const router = express.Router();

router
  .route("/all/refund-request")
  .get(protect, restrict_to("admin"), getAllRefundRequests);
router.route("/rules").get(protect, restrict_to("admin"), getRefundRules);
router
  .route("/update/status/:refundId")
  .patch(protect, restrict_to("admin"), updateRefundStatus);
router
  .route("/set/refund-rule")
  .post(protect, restrict_to("admin"), setRefundRules);

module.exports = router;
