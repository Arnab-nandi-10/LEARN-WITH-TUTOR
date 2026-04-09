const { Router } = require("express");
const {
  getAllTransactions,
  getTransactionDetails,
  verifyPayment,
} = require("../../controllers/admin/adminPayment.controllers.js");
const { protect } = require("../../middlewares/auth_middleware.js");
const { restrict_to } = require("../../middlewares/role_middleware.js");

const router = Router();

router
  .route("/all/payments")
  .get(protect, restrict_to("admin"), getAllTransactions);
router
  .route("/payment/:paymentId")
  .get(protect, restrict_to("admin"), getTransactionDetails);
router
  .route("/payment/verify/:paymentId")
  .patch(protect, restrict_to("admin"), verifyPayment);

module.exports = router;
