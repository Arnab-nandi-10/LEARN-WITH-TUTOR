const express=require("express")
const router=express.Router()
const analytics_controller=require("../controllers/analytics_controller")
const {protect}=require("../middlewares/auth_middleware")

router.get("/:course_id",protect,analytics_controller.get_course_analytics)

module.exports=router