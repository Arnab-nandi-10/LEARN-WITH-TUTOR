const module_service=require("../services/module_service")

const create_module=async(req,res,next)=>{
    try{
        const data=await module_service.create_module(
            req.params.course_id,
            req.body,
            req.user
        )
        res.status(201).json({success:true,data})
    }catch(err){next(err)}
}
const get_modules=async(req,res,next)=>{
    try{
        const data=await module_service.get_modules(req.params.course_id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_module=async(req,res,next)=>{
    try{
        const data=await module_service.get_module(req.params.module_id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const update_module=async(req,res,next)=>{
    try{
        const data=await module_service.update_module(
            req.params.module_id,
            req.body,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const delete_module=async(req,res,next)=>{
    try{
        const data=await module_service.delete_module(req.params.module_id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const reorder_modules=async(req,res,next)=>{
    try{
        const data=await module_service.reorder_modules(
            req.params.course_id,
            req.body.modules,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={
    create_module,
    get_modules,
    get_module,
    update_module,
    delete_module,
    reorder_modules
}