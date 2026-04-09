const attempt_service=require("../services/attempt_service")
const submit_attempt=async(req,res,next)=>{
    try{
        const data=await attempt_service.submit_attempt(
            req.params.exam_id,
            req.body.answers,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_exam_attempts=async(req,res,next)=>{
    try{
        const data=await attempt_service.get_exam_attempts(req.params.exam_id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_attempt=async(req,res,next)=>{
    try{
        const data=await attempt_service.get_attempt(req.params.id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={submit_attempt,get_exam_attempts,get_attempt}