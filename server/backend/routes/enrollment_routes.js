const express=require("express")
const router=express.Router()
const enrollment_controller=require("../controllers/enrollment_controller")
const {protect}=require("../middlewares/auth_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.post("/:course_id",protect,restrict_to("student"),enrollment_controller.enroll_course)
router.get("/my",protect,enrollment_controller.get_my_courses)
router.delete("/:course_id",protect,restrict_to("student"),enrollment_controller.unenroll_course)
router.put("/:course_id",protect,restrict_to("student"),enrollment_controller.update_enrollment)

module.exports=router