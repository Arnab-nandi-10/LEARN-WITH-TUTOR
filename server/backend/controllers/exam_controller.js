const exam_service=require("../services/exam_service")
const create_exam=async(req,res,next)=>{
    try{
        const data=await exam_service.create_exam(req.body,req.user)
        res.status(201).json({success:true,data})
    }catch(err){next(err)}
}
const get_exam=async(req,res,next)=>{
    try{
        const data=await exam_service.get_exam(req.params.id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const update_exam=async(req,res,next)=>{
    try{
        const data=await exam_service.update_exam(req.params.id,req.body,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const delete_exam=async(req,res,next)=>{
    try{
        const data=await exam_service.delete_exam(req.params.id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_course_exams=async(req,res,next)=>{
    try{
        const data=await exam_service.get_course_exams(req.params.course_id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={create_exam,get_exam,update_exam,delete_exam,get_course_exams}