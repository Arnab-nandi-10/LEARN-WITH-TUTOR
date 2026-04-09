const express=require("express")
const router=express.Router()
const question_controller=require("../controllers/question_controller")
const {protect}=require("../middlewares/auth_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.post("/",protect,restrict_to("faculty"),question_controller.add_question)
router.get("/exam/:exam_id",protect,question_controller.get_questions_by_exam)
router.patch("/:id",protect,restrict_to("faculty"),question_controller.update_question)
router.delete("/:id",protect,restrict_to("faculty"),question_controller.delete_question)
module.exports=router