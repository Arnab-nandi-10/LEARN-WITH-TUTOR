const upload_service=require("../services/upload_service")
const AppError=require("../utils/app_error")

const resolve_file_key=(req)=>{
    const file_key=req.params.file_key||req.query.file_key
    if(!file_key) throw new AppError("file key is required",400)
    return file_key
}

const generate_upload_url=async(req,res,next)=>{
    try{
        const {file_type}=req.body
        const data=await upload_service.generate_upload_url(file_type)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_file_info=async(req,res,next)=>{
    try{
        const data=await upload_service.get_file_info(resolve_file_key(req))
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const delete_file=async(req,res,next)=>{
    try{
        const data=await upload_service.delete_file(resolve_file_key(req),req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={generate_upload_url,get_file_info,delete_file}
