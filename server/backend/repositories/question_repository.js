const Question=require("../models/question_model")
const add_question=(data)=>Question.create(data)
const get_questions_by_exam=(exam_id)=>{
    return Question.find({exam_id})
}
const get_question_by_id=(id)=>{
    return Question.findById(id)
}
const update_question=(id,data)=>{
    return Question.findByIdAndUpdate(id,data,{new:true})
}
const delete_question=(id)=>{
    return Question.findByIdAndDelete(id)
}
module.exports={
    add_question,
    get_questions_by_exam,
    get_question_by_id,
    update_question,
    delete_question
}