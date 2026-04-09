const express = require("express")
const router = express.Router()
const user_controller = require("../controllers/user_controller")
const { protect } = require("../middlewares/auth_middleware")
const { restrict_to } = require("../middlewares/role_middleware")

router.get("/", protect, restrict_to("admin"), user_controller.get_all_users)
router.get("/:id/enrollments", protect, restrict_to("admin"), user_controller.get_user_enrollments)
router.get("/:id", protect, restrict_to("admin"), user_controller.get_user_by_id)

module.exports = router
