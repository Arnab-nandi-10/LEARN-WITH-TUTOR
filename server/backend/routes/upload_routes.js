const express=require("express")
const router=express.Router()
const {generate_upload_url,get_file_info,delete_file}=require("../controllers/upload_controller")
const {protect}=require("../middlewares/auth_middleware")
const {restrict_to}=require("../middlewares/role_middleware")

router.post("/generate-url",protect,generate_upload_url)
router.get("/file",protect,get_file_info)
router.delete("/file",protect,restrict_to("faculty"),delete_file)
router.get("/file/:file_key",protect,get_file_info)
router.delete("/file/:file_key",protect,restrict_to("faculty"),delete_file)

module.exports=router
