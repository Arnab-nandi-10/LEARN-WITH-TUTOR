const progress_service=require("../services/progress_service")
const mark_complete=async(req,res,next)=>{
    try{
        const data=await progress_service.mark_lesson_complete(
            req.params.lesson_id,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_progress=async(req,res,next)=>{
    try{
        const data=await progress_service.get_course_progress(
            req.params.course_id,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const reset_progress=async(req,res,next)=>{
    try{
        const data=await progress_service.reset_course_progress(
            req.params.course_id,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const update_progress=async(req,res,next)=>{
    try{
        const data=await progress_service.update_lesson_progress(
            req.params.lesson_id,
            req.body,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={
    mark_complete,
    get_progress,
    reset_progress,
    update_progress
}