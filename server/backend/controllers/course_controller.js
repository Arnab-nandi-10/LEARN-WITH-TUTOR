const course_service=require("../services/course_service")
const create_course=async(req,res,next)=>{
    try{
        const data=await course_service.create_course(req.body,req.user)
        res.status(201).json({success:true,data})
    }catch(err){next(err)}
}
const update_course=async(req,res,next)=>{
    try{
        const data=await course_service.update_course(req.params.id,req.body,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const delete_course=async(req,res,next)=>{
    try{
        const data=await course_service.delete_course(req.params.id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const publish_course=async(req,res,next)=>{
    try{
        const data=await course_service.publish_course(req.params.id,req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_my_courses=async(req,res,next)=>{
    try{
        const data=await course_service.get_my_courses(req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_full_course=async(req,res,next)=>{
    try{
        const data=await course_service.get_full_course(
            req.params.id,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_faculty_courses=async(req,res,next)=>{
    try{
        const data=await course_service.get_faculty_courses(req.user.id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const get_all_courses=async(req,res,next)=>{
    try{
        const data=await course_service.get_all_courses()
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
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