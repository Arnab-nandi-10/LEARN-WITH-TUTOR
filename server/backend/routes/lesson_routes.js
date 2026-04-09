const express=require("express")
const router=express.Router({mergeParams:true})
const lesson_controller=require("../controllers/lesson_controller")
const {protect}=require("../middlewares/auth_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.post("/",protect,restrict_to("faculty"),lesson_controller.create_lesson)
router.get("/",protect,lesson_controller.get_lessons)
router.patch("/reorder",protect,restrict_to("faculty"),lesson_controller.reorder_lessons)
router.get("/:lesson_id",protect,lesson_controller.get_lesson)
router.put("/:lesson_id",protect,restrict_to("faculty"),lesson_controller.update_lesson)
router.delete("/:lesson_id",protect,restrict_to("faculty"),lesson_controller.delete_lesson)

module.exports=router