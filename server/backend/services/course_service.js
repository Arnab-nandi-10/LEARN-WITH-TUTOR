const course_repo=require("../repositories/course_repository")
const module_repo=require("../repositories/module_repository")
const enrollment_repo=require("../repositories/enrollment_repository")
const AppError=require("../utils/app_error")

const get_preview_modules=(modules)=>{
    return modules.map((module)=>({
        ...module,
        lessons:(module.lessons||[]).filter((lesson)=>lesson.is_preview)
    }))
}

const create_course=async(data,user)=>{
    if(user.role!=="faculty") throw new AppError("only faculty can create courses",403)
    const course=await course_repo.create_course({
        ...data,
        faculty_id:user.id,
        isApproved:false
    })
    return course
}
const update_course=async(course_id,data,user)=>{
    const course=await course_repo.get_course_by_id(course_id)
    if(!course) throw new AppError("course not found",404)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    const updated=await course_repo.update_course(course_id,data)
    return updated
}
const delete_course=async(course_id,user)=>{
    const course=await course_repo.get_course_by_id(course_id)
    if(!course) throw new AppError("course not found",404)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    await course_repo.delete_course(course_id)
    return {message:"course deleted"}
}
const publish_course=async(course_id,user)=>{
    const course=await course_repo.get_course_by_id(course_id)
    if(!course) throw new AppError("course not found",404)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    course.status="published"
    await course.save()
    return course
}
const get_my_courses=async(user)=>{
    if(user.role!=="faculty") throw new AppError("not authorized",403)
    return await course_repo.get_courses_by_faculty(user.id)
}

const get_full_course=async(course_id,user)=>{
    const course=await course_repo.get_course_by_id(course_id)
    if(!course) throw new AppError("course not found",404)
    if(user.role==="faculty"&&course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    if(
        user.role==="student" &&
        (course.status!=="published" || course.isApproved===false)
    ){
        throw new AppError("course not available",403)
    }

    const modules=await module_repo.get_modules_with_lessons(course_id)

    if(user.role==="student"){
        const enrollment=await enrollment_repo.find_enrollment(user.id,course_id)

        if(!enrollment){
            return {
                course,
                modules:get_preview_modules(modules),
                access_mode:"preview"
            }
        }

        return {
            course,
            modules,
            access_mode:"full"
        }
    }

    return {
        course,
        modules,
        access_mode:"full"
    }
}
const get_faculty_courses=async(user_id)=>{
    return await course_repo.get_courses_by_faculty(user_id)
}
const get_all_courses=async()=>{
    return await course_repo.get_all_published_courses()
}

module.exports={
    get_full_course,
    create_course,
    update_course,
    delete_course,
    publish_course,
    get_my_courses,
    get_faculty_courses,
    get_all_courses
}
