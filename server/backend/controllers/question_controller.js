const question_service=require("../services/question_service")

const add_question=async(req,res,next)=>{
    try{
        const data=await question_service.add_question(req.body,req.user)
        res.status(201).json({success:true,data})
    }catch(err){next(err)}
}
const get_questions_by_exam=async(req,res,next)=>{
    try{
        const data=await question_service.get_questions_by_exam(req.params.exam_id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const update_question=async(req,res,next)=>{
    try{
        const data=await question_service.update_question(req.params.id,req.body,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const delete_question=async(req,res,next)=>{
    try{
        const data=await question_service.delete_question(req.params.id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
module.exports={add_question,get_questions_by_exam,update_question,delete_question}