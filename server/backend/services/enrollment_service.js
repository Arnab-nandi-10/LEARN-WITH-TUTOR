const enrollment_repo=require("../repositories/enrollment_repository")
const course_repo=require("../repositories/course_repository")
const AppError=require("../utils/app_error")

const enroll_course=async(course_id,user)=>{
    if(user.role!=="student") throw new AppError("only students can enroll",403)
    const course=await course_repo.get_course_by_id(course_id)
    if(!course) throw new AppError("course not found",404)
    if(course.status!=="published"){
        throw new AppError("course not available",400)
    }
    const existing=await enrollment_repo.find_enrollment(user.id,course_id)
    if(existing) throw new AppError("already enrolled",400)
    const enrollment=await enrollment_repo.create_enrollment({
        user_id:user.id,
        course_id
    })
    return enrollment
}
const get_my_courses=async(user)=>{
    return await enrollment_repo.get_user_enrollments(user.id)
}
const unenroll_course=async(course_id,user)=>{
    if(user.role!=="student") throw new AppError("only students can unenroll",403)
    const enrollment=await enrollment_repo.find_enrollment(user.id,course_id)
    if(!enrollment) throw new AppError("not enrolled in this course",404)
    await enrollment_repo.delete_enrollment(user.id,course_id)
    return {message:"successfully unenrolled"}
}
const update_enrollment=async(course_id,data,user)=>{
    if(user.role!=="student") throw new AppError("only students can update enrollment",403)
    const enrollment=await enrollment_repo.find_enrollment(user.id,course_id)
    if(!enrollment) throw new AppError("not enrolled in this course",404)
    const updated=await enrollment_repo.update_enrollment(enrollment._id,data)
    return updated
}

module.exports={
    enroll_course,
    get_my_courses,
    unenroll_course,
    update_enrollment
}