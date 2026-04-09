const module_repo=require("../repositories/module_repository")
const course_repo=require("../repositories/course_repository")
const AppError=require("../utils/app_error")

const create_module=async(course_id,data,user)=>{
    const course=await course_repo.get_course_by_id(course_id)
    if(!course) throw new AppError("course not found",404)

    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    const last=await module_repo.get_last_module(course_id)
    const order=last?last.order+1:1
    const module=await module_repo.create_module({
        course_id,
        title:data.title,
        order
    })
    course.total_modules+=1
    await course.save()
    
    return module
}

const get_modules=async(course_id)=>{
    return await module_repo.get_modules_by_course(course_id)
}

const get_module=async(module_id)=>{
    const module=await module_repo.get_module_by_id(module_id)
    if(!module) throw new AppError("module not found",404)
    return module
}

const update_module=async(module_id,data,user)=>{
    const module=await module_repo.get_module_by_id(module_id)
    if(!module) throw new AppError("module not found",404)
    const course=await course_repo.get_course_by_id(module.course_id)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    return await module_repo.update_module(module_id,data)
}

const delete_module=async(module_id,user)=>{
    const module=await module_repo.get_module_by_id(module_id)
    if(!module) throw new AppError("module not found",404)
    const course=await course_repo.get_course_by_id(module.course_id)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    await module_repo.delete_module(module_id)
    course.total_modules-=1
    await course.save()
    return {message:"module deleted"}
}

const reorder_modules=async(course_id,modules,user)=>{
    const course=await course_repo.get_course_by_id(course_id)
    if(!course) throw new AppError("course not found",404)
    if(course.faculty_id.toString()!==user.id.toString()){
        throw new AppError("not authorized",403)
    }
    const updates=modules.map((m,index)=>{
        return module_repo.update_module(m.id,{order:index+1})
    })
    await Promise.all(updates)

    return {message:"modules reordered"}
}

module.exports={
    create_module,
    get_modules,
    get_module,
    update_module,
    delete_module,
    reorder_modules
}
