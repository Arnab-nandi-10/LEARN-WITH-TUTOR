const express=require("express")
const router=express.Router()
const progress_controller=require("../controllers/progress_controller")
const {protect}=require("../middlewares/auth_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.post("/:lesson_id",protect,restrict_to("student"),progress_controller.mark_complete)
router.get("/:course_id",protect,progress_controller.get_progress)
router.delete("/:course_id",protect,restrict_to("student"),progress_controller.reset_progress)
router.put("/:lesson_id",protect,restrict_to("student"),progress_controller.update_progress)

module.exports=router