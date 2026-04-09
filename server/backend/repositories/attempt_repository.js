const Attempt=require("../models/attempt_model")
const create_attempt=(data)=>Attempt.create(data)
const get_attempt=(user_id,exam_id)=>{
    return Attempt.findOne({user_id,exam_id})
}
const get_attempt_by_id=(attempt_id)=>{
    return Attempt.findById(attempt_id).populate('user_id','name email').populate('exam_id','title')
}
const get_attempts_by_exam=(exam_id)=>{
    return Attempt.find({exam_id}).populate('user_id','name email').sort({createdAt:-1})
}
const get_course_attempts=async(course_id)=>{
    const Attempt=require("../models/attempt_model")
    const Exam=require("../models/exam_model")
    const exams=await Exam.find({course_id})
    const exam_ids=exams.map(e=>e._id)
    return Attempt.find({exam_id:{$in:exam_ids}})
}
module.exports={
    create_attempt,
    get_attempt,
    get_attempt_by_id,
    get_attempts_by_exam,
    get_course_attempts
}