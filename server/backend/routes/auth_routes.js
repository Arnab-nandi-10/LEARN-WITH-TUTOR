const express=require("express")
const router=express.Router()
const auth_controller=require("../controllers/auth_controller")
const validate=require("../middlewares/validate_middleware")
const {signup_schema,login_schema}=require("../validations/auth_validation")
const {protect}=require("../middlewares/auth_middleware")

router.post("/signup",validate(signup_schema),auth_controller.signup)
router.post("/login",validate(login_schema),auth_controller.login)
router.post("/refresh",auth_controller.refresh)
router.post("/logout",auth_controller.logout)
router.get("/me",protect,auth_controller.get_current_user)

module.exports=router