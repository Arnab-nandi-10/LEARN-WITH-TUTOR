const express=require("express")
const router=express.Router()
const exam_controller=require("../controllers/exam_controller")
const {protect}=require("../middlewares/auth_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.post("/",protect,restrict_to("faculty"),exam_controller.create_exam)
router.get("/course/:course_id",protect,exam_controller.get_course_exams)
router.get("/:id",protect,exam_controller.get_exam)
router.put("/:id",protect,restrict_to("faculty"),exam_controller.update_exam)
router.delete("/:id",protect,restrict_to("faculty"),exam_controller.delete_exam)

module.exports=router