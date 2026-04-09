const enrollment_repo=require("../repositories/enrollment_repository")
const progress_repo=require("../repositories/progress_repository")
const attempt_repo=require("../repositories/attempt_repository")
const module_repo=require("../repositories/module_repository")
const lesson_repo=require("../repositories/lesson_repository")

const get_course_analytics=async(course_id)=>{
    const enrollments=await enrollment_repo.get_course_enrollments(course_id)
    const total_students=enrollments.length
    const progress_data=await progress_repo.get_all_course_progress(course_id)
    const total_progress=progress_data.length
    const attempts=await attempt_repo.get_course_attempts(course_id)
    const total_attempts=attempts.length
    return {
        total_students,
        total_progress_records:total_progress,
        total_attempts
    }
}

module.exports={get_course_analytics}