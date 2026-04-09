const lesson_repo=require("../repositories/lesson_repository")
const module_repo=require("../repositories/module_repository")
const course_repo=require("../repositories/course_repository")
const AppError=require("../utils/app_error")

const is_supported_video_url=(value)=>{
    try{
        const parsed=new URL(value)
        const hostname=parsed.hostname.toLowerCase()

        return (
            hostname.includes("amazonaws.com") ||
            hostname==="storage.googleapis.com" ||
            hostname==="storage-download.googleapis.com" ||
            hostname.endsWith(".storage.googleapis.com")
        )
    }catch(err){
        return false
    }
}

const create_lesson=async(module_id,data,user)=>{
    const module=await module_repo.get_module_by_id(module_id)
    if(!module) throw new AppError("module not found",404)
    const course=await course_repo.get_course_by_id(module.course_id)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    if(data.type==="video" && !data.content_url){
        throw new AppError("video url required",400)
    }
    if(data.type==="video" && !is_supported_video_url(data.content_url)){
        throw new AppError("invalid video url: use AWS S3 or Google Cloud Storage",400)
    }
    const last=await lesson_repo.get_last_lesson(module_id)
    const order=last?last.order+1:1
    const lesson=await lesson_repo.create_lesson({
        module_id,
        title:data.title,
        type:data.type,
        content_url:data.content_url,
        content_text:data.content_text,
        order,
        duration:data.duration||0
    })
    module.total_lessons+=1
    await module.save()
    
    await course_repo.update_course_duration(module.course_id)
    await course.save()

    return lesson
}

const get_lessons=async(module_id)=>{
    return await lesson_repo.get_lessons_by_module(module_id)
}

const get_lesson=async(lesson_id)=>{
    const lesson=await lesson_repo.get_lesson_by_id(lesson_id)
    if(!lesson) throw new AppError("lesson not found",404)
    return lesson
}

const update_lesson=async(lesson_id,data,user)=>{
    const lesson=await lesson_repo.get_lesson_by_id(lesson_id)
    if(!lesson) throw new AppError("lesson not found",404)
    const module=await module_repo.get_module_by_id(lesson.module_id)
    const course=await course_repo.get_course_by_id(module.course_id)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }

    if(data.type==="video" && !data.content_url){
        throw new AppError("video url required",400)
    }
    if(data.type==="video" && data.content_url && !is_supported_video_url(data.content_url)){
        throw new AppError("invalid video url: use AWS S3 or Google Cloud Storage",400)
    }

    return await lesson_repo.update_lesson(lesson_id,data)
}

const delete_lesson=async(lesson_id,user)=>{
    const lesson=await lesson_repo.get_lesson_by_id(lesson_id)
    if(!lesson) throw new AppError("lesson not found",404)
    const module=await module_repo.get_module_by_id(lesson.module_id)
    const course=await course_repo.get_course_by_id(module.course_id)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    await lesson_repo.delete_lesson(lesson_id)
    module.total_lessons-=1
    await module.save()
    await course_repo.update_course_duration(module.course_id)
    return {message:"lesson deleted"}
}

const reorder_lessons=async(module_id,lessons,user)=>{
    const module=await module_repo.get_module_by_id(module_id)
    if(!module) throw new AppError("module not found",404)
    const course=await course_repo.get_course_by_id(module.course_id)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    const updates=lessons.map((l,index)=>{
        return lesson_repo.update_lesson(l.id,{order:index+1})
    })
    await Promise.all(updates)

    return {message:"lessons reordered"}
}

module.exports={
    create_lesson,
    get_lessons,
    get_lesson,
    update_lesson,
    delete_lesson,
    reorder_lessons
}
