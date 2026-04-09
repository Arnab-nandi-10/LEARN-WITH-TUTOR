const express=require("express")
const router=express.Router({mergeParams:true})
const module_controller=require("../controllers/module_controller")
const {protect}=require("../middlewares/auth_middleware")
const {check_course_access}=require("../middlewares/access_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.get("/",protect,check_course_access,module_controller.get_modules)
router.post("/",protect,restrict_to("faculty"),module_controller.create_module)
router.patch("/reorder",protect,restrict_to("faculty"),module_controller.reorder_modules)
router.get("/:module_id",protect,module_controller.get_module)
router.put("/:module_id",protect,restrict_to("faculty"),module_controller.update_module)
router.delete("/:module_id",protect,restrict_to("faculty"),module_controller.delete_module)

module.exports=router