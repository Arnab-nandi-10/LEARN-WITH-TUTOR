const { Router } = require("express");
const {
  getCurrentAdminUser,
  getAdminById,
  getFacultyById,
  getStudentById,
  getAllAdmins,
  getAllFaculty,
  getAllStudents,
  toggleVerification,
} = require("../../controllers/admin/adminUser.controller.js");
const { protect } = require("../../middlewares/auth_middleware.js");
const { restrict_to } = require("../../middlewares/role_middleware.js");

const router = Router();

router.route("/c/user").get(protect, restrict_to("admin"), getCurrentAdminUser);
router.route("/a/user/:id").get(protect, restrict_to("admin"), getAdminById);
router.route("/f/user/:id").get(protect, restrict_to("admin"), getFacultyById);
router.route("/s/user/:id").get(protect, restrict_to("admin"), getStudentById);
router.route("/all/a/user").get(protect, restrict_to("admin"), getAllAdmins);
router.route("/all/f/user").get(protect, restrict_to("admin"), getAllFaculty);
router.route("/all/s/user").get(protect, restrict_to("admin"), getAllStudents);
router
  .route("/toggle/v/:userId")
  .patch(protect, restrict_to("admin"), toggleVerification);

module.exports = router;
