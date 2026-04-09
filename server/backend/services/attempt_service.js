const attempt_repo=require("../repositories/attempt_repository")
const question_repo=require("../repositories/question_repository")
const exam_repo=require("../repositories/exam_repository")
const enrollment_repo=require("../repositories/enrollment_repository")
const AppError=require("../utils/app_error")

const submit_attempt=async(exam_id,answers,user)=>{
    if(user.role!=="student") throw new AppError("only students allowed",403)
    const exam=await exam_repo.get_exam_by_id(exam_id)
    const existing=await attempt_repo.get_attempt(user.id,exam_id)
    if(existing) throw new AppError("already attempted",400)
    if(!exam) throw new AppError("exam not found",404)
    const enrollment=await enrollment_repo.find_enrollment(user.id,exam.course_id)
    if(!enrollment) throw new AppError("not enrolled",403)
    const questions=await question_repo.get_questions_by_exam(exam_id)
    if(!answers||answers.length===0){
        throw new AppError("answers required",400)
    }
    let score=0
    const question_map={}
    questions.forEach(q=>{
        question_map[q._id]=q
    })
    answers.forEach(a=>{
        const q=question_map[a.question_id]
        if(!q){
            throw new AppError("invalid question",400)
        }
        if(q.exam_id.toString()!==exam_id){
            throw new AppError("invalid question",400)
        }
        if(q && q.correct_answer===a.selected_option){
            score+=q.marks
        }
    })
    const result=await attempt_repo.create_attempt({
        user_id:user.id,
        exam_id,
        answers,
        score,
        status:"completed"
    })
    const passed=score>=exam.passing_marks
    return {
        score,
        total:exam.total_marks,
        passed
    }
}
const get_exam_attempts=async(exam_id,user)=>{
    const exam=await exam_repo.get_exam_by_id(exam_id)
    if(!exam) throw new AppError("exam not found",404)
    
    if(user.role==="faculty"){
        return attempt_repo.get_attempts_by_exam(exam_id)
    }else if(user.role==="student"){
        return attempt_repo.get_attempt(user.id,exam_id)
    }else{
        throw new AppError("unauthorized",403)
    }
}
const get_attempt=async(attempt_id,user)=>{
    const attempt=await attempt_repo.get_attempt_by_id(attempt_id)
    if(!attempt) throw new AppError("attempt not found",404)
    
    if(user.role==="faculty"||attempt.user_id.toString()===user.id){
        return attempt
    }else{
        throw new AppError("unauthorized",403)
    }
}

module.exports={submit_attempt,get_exam_attempts,get_attempt}