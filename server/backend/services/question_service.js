const question_repo=require("../repositories/question_repository")
const exam_repo=require("../repositories/exam_repository")
const AppError=require("../utils/app_error")

const add_question=async(data,user)=>{
    if(user.role!=="faculty") throw new AppError("only faculty allowed",403)
    const exam=await exam_repo.get_exam_by_id(data.exam_id)
    if(!exam) throw new AppError("exam not found",404)
    if(!data.options||data.options.length<2){
        throw new AppError("minimum 2 options required",400)
    }
    if(data.correct_answer>=data.options.length){
        throw new AppError("invalid correct answer index",400)
    }
    const question=await question_repo.add_question(data)
    await exam_repo.update_exam_total_marks(data.exam_id)
    return question
}
const get_questions_by_exam=async(exam_id,user)=>{
    const exam=await exam_repo.get_exam_by_id(exam_id)
    if(!exam) throw new AppError("exam not found",404)
    
    if(user.role==="faculty"){
        return question_repo.get_questions_by_exam(exam_id)
    }else{
        const questions=await question_repo.get_questions_by_exam(exam_id)
        return questions.map(q=>({
            _id:q._id,
            question_text:q.question_text,
            options:q.options,
            marks:q.marks
        }))
    }
}
const update_question=async(id,data,user)=>{
    if(user.role!=="faculty") throw new AppError("only faculty allowed",403)
    const question=await question_repo.get_question_by_id(id)
    if(!question) throw new AppError("question not found",404)
    const updated=await question_repo.update_question(id,data)
    await exam_repo.update_exam_total_marks(question.exam_id)
    return updated
}
const delete_question=async(id,user)=>{
    if(user.role!=="faculty") throw new AppError("only faculty allowed",403)
    const question=await question_repo.get_question_by_id(id)
    if(!question) throw new AppError("question not found",404)
    await question_repo.delete_question(id)
    await exam_repo.update_exam_total_marks(question.exam_id)
    return {message:"question deleted"}
}

module.exports={add_question,get_questions_by_exam,update_question,delete_question}