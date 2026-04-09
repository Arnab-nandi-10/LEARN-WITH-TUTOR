const progress_repo=require("../repositories/progress_repository")
const lesson_repo=require("../repositories/lesson_repository")
const module_repo=require("../repositories/module_repository")
const course_repo=require("../repositories/course_repository")
const enrollment_repo=require("../repositories/enrollment_repository")
const AppError=require("../utils/app_error")
const mark_lesson_complete=async(lesson_id,user)=>{
    if(user.role!=="student") throw new AppError("only students allowed",403)
    const lesson=await lesson_repo.update_lesson(lesson_id,{})
    if(!lesson) throw new AppError("lesson not found",404)
    const module=await module_repo.update_module(lesson.module_id,{})
    const course=await course_repo.get_course_by_id(module.course_id)
    const enrollment=await enrollment_repo.find_enrollment(user.id,course._id)
    if(!enrollment) throw new AppError("not enrolled",403)
    const existing=await progress_repo.find_progress(user.id,lesson_id)
    if(existing) return existing
    return await progress_repo.mark_completed({
        user_id:user.id,
        course_id:course._id,
        module_id:module._id,
        lesson_id
    })
}
const get_course_progress=async(course_id,user)=>{
    const progress=await progress_repo.get_course_progress(user.id,course_id)
    const modules=await module_repo.get_modules_by_course(course_id)
    const module_ids=modules.map(m=>m._id)
    const lessons=await lesson_repo.get_lessons_by_module_ids(module_ids)
    const total=lessons.length
    const completed=progress.length
    const percentage=total?Math.round((completed/total)*100):0
    return {
        completed,
        total,
        percentage
    }
}
const reset_course_progress=async(course_id,user)=>{
    if(user.role!=="student") throw new AppError("only students allowed",403)
    const enrollment=await enrollment_repo.find_enrollment(user.id,course_id)
    if(!enrollment) throw new AppError("not enrolled",403)
    await progress_repo.delete_course_progress(user.id,course_id)
    return {message:"progress reset successfully"}
}
const update_lesson_progress=async(lesson_id,data,user)=>{
    if(user.role!=="student") throw new AppError("only students allowed",403)
    const existing=await progress_repo.find_progress(user.id,lesson_id)
    if(!existing) throw new AppError("progress not found",404)
    const updated=await progress_repo.update_progress(existing._id,data)
    return updated
}

module.exports={
    mark_lesson_complete,
    get_course_progress,
    reset_course_progress,
    update_lesson_progress
}