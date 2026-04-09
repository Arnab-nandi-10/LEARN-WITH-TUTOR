const Exam=require("../models/exam_model")
const create_exam=(data)=>Exam.create(data)
const get_exam_by_id=(id)=>Exam.findById(id)
const update_exam=(id,data)=>Exam.findByIdAndUpdate(id,data,{new:true})
const delete_exam=(id)=>Exam.findByIdAndDelete(id)
const Question=require("../models/question_model")

const update_exam_total_marks=async(exam_id)=>{
    const questions=await Question.find({exam_id})
    const total=questions.reduce((sum,q)=>sum+q.marks,0)
    return Exam.findByIdAndUpdate(exam_id,{total_marks:total},{new:true})
}
const get_exam_by_module=(module_id)=>{
    return Exam.findOne({module_id})
}
const get_final_exam=(course_id)=>{
    return Exam.findOne({course_id,module_id:null})
}
const get_exams_by_course=(course_id)=>{
    return Exam.find({course_id}).sort({createdAt:-1})
}
module.exports={
    create_exam,
    get_exam_by_id,
    update_exam,
    delete_exam,
    get_exam_by_module,
    get_final_exam,
    update_exam_total_marks,
    get_exams_by_course
}