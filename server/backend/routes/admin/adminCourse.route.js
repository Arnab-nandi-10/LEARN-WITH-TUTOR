const { Router } = require("express");
const {
  getAllApprovedCourses,
  getAllRejectedCourses,
  getCourseById,
  toggleCourseApproval,
  updateCoursePrice,
  deleteCourse,
} = require("../../controllers/admin/adminCourse.controller.js");
const { protect } = require("../../middlewares/auth_middleware.js");
const { restrict_to } = require("../../middlewares/role_middleware.js");

const router = Router();

router
  .route("/all/approved")
  .get(protect, restrict_to("admin"), getAllApprovedCourses);
router
  .route("/all/rejected")
  .get(protect, restrict_to("admin"), getAllRejectedCourses);
router.route("/:courseId").get(protect, restrict_to("admin"), getCourseById);
router
  .route("/toggle/:courseId")
  .patch(protect, restrict_to("admin"), toggleCourseApproval);
router
  .route("/update/price/:id")
  .patch(protect, restrict_to("admin"), updateCoursePrice);
router.route("/delete/:id").delete(protect, restrict_to("admin"), deleteCourse);

module.exports = router;
