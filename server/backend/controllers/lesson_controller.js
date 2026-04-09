const lesson_service=require("../services/lesson_service")

const create_lesson=async(req,res,next)=>{
    try{
        const data=await lesson_service.create_lesson(
            req.params.module_id,
            req.body,
            req.user
        )
        res.status(201).json({success:true,data})
    }catch(err){next(err)}
}
const get_lessons=async(req,res,next)=>{
    try{
        const data=await lesson_service.get_lessons(req.params.module_id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_lesson=async(req,res,next)=>{
    try{
        const data=await lesson_service.get_lesson(req.params.lesson_id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const update_lesson=async(req,res,next)=>{
    try{
        const data=await lesson_service.update_lesson(
            req.params.lesson_id,
            req.body,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const delete_lesson=async(req,res,next)=>{
    try{
        const data=await lesson_service.delete_lesson(req.params.lesson_id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const reorder_lessons=async(req,res,next)=>{
    try{
        const data=await lesson_service.reorder_lessons(
            req.params.module_id,
            req.body.lessons,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={
    create_lesson,
    get_lessons,
    get_lesson,
    update_lesson,
    delete_lesson,
    reorder_lessons
}