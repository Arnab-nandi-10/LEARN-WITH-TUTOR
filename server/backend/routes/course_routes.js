const express=require("express")
const router=express.Router()
const course_controller=require("../controllers/course_controller")
const {protect}=require("../middlewares/auth_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.post("/",protect,restrict_to("faculty"),course_controller.create_course)
router.get("/",course_controller.get_all_courses)
router.get("/my",protect,course_controller.get_my_courses)
router.get("/faculty",protect,restrict_to("faculty"),course_controller.get_faculty_courses)
router.get("/:id/full",protect,course_controller.get_full_course)
router.get("/:id",protect,course_controller.get_full_course)
router.put("/:id",protect,restrict_to("faculty"),course_controller.update_course)
router.patch("/:id/publish",protect,restrict_to("faculty"),course_controller.publish_course)
router.delete("/:id",protect,restrict_to("faculty"),course_controller.delete_course)

module.exports=router