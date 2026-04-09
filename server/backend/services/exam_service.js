const exam_repo=require("../repositories/exam_repository")
const module_repo=require("../repositories/module_repository")
const course_repo=require("../repositories/course_repository")
const AppError=require("../utils/app_error")
const question_repo=require("../repositories/question_repository")

const create_exam=async(data,user)=>{
    if(user.role!=="faculty") throw new AppError("only faculty allowed",403)
    const course=await course_repo.get_course_by_id(data.course_id)
    if(!course) throw new AppError("course not found",404)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    if(data.module_id){
        const module=await module_repo.update_module(data.module_id,{})
        if(!module) throw new AppError("module not found",404)
        const existing=await exam_repo.get_exam_by_module(data.module_id)
        if(existing){
            throw new AppError("exam already exists for this module",400)
        }
    }
    if(!data.module_id){
        const existing=await exam_repo.get_final_exam(data.course_id)
        if(existing){
            throw new AppError("final exam already exists",400)
        }
    }
    return await exam_repo.create_exam(data)
}

const get_exam=async(exam_id)=>{
    const exam=await exam_repo.get_exam_by_id(exam_id)
    if(!exam) throw new AppError("exam not found",404)

    const questions=await question_repo.get_questions_by_exam(exam_id)

    return {
        exam,
        questions
    }
}

const get_course_exams=async(course_id)=>{
    const course=await course_repo.get_course_by_id(course_id)
    if(!course) throw new AppError("course not found",404)
    return await exam_repo.get_exams_by_course(course_id)
}

const update_exam=async(exam_id,data,user)=>{
    const exam=await exam_repo.get_exam_by_id(exam_id)
    if(!exam) throw new AppError("exam not found",404)
    const course=await course_repo.get_course_by_id(exam.course_id)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    return await exam_repo.update_exam(exam_id,data)
}

const delete_exam=async(exam_id,user)=>{
    const exam=await exam_repo.get_exam_by_id(exam_id)
    if(!exam) throw new AppError("exam not found",404)
    const course=await course_repo.get_course_by_id(exam.course_id)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    await exam_repo.delete_exam(exam_id)
    return {message:"exam deleted"}
}

module.exports={create_exam,get_exam,get_course_exams,update_exam,delete_exam}