const express = require("express");
const {
  quoteOrder,
  createOrder,
  verifyPayment,
} = require("../controllers/payment.controller.js");
const { protect } = require("../middlewares/auth_middleware.js");

const router = express.Router();

router.route("/quote").post(protect, quoteOrder);
router.route("/create-order").post(protect, createOrder);
router.route("/verify").post(verifyPayment);

module.exports = router;
