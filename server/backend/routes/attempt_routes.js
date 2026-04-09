const express=require("express")
const router=express.Router()
const attempt_controller=require("../controllers/attempt_controller")
const {protect}=require("../middlewares/auth_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.post("/:exam_id",protect,restrict_to("student"),attempt_controller.submit_attempt)
router.get("/exam/:exam_id",protect,attempt_controller.get_exam_attempts)
router.get("/:id",protect,attempt_controller.get_attempt)

module.exports=router