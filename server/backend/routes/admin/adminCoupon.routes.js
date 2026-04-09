const { Router } = require("express");
const {
  getAllCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
} = require("../../controllers/admin/adminCoupon.controller.js");
const { protect } = require("../../middlewares/auth_middleware.js");
const { restrict_to } = require("../../middlewares/role_middleware.js");

const router = Router();

router
  .route("/")
  .get(protect, restrict_to("admin"), getAllCoupons)
  .post(protect, restrict_to("admin"), createCoupon);

router
  .route("/:couponId/toggle")
  .patch(protect, restrict_to("admin"), toggleCouponStatus);

router
  .route("/:couponId")
  .delete(protect, restrict_to("admin"), deleteCoupon);

module.exports = router;
