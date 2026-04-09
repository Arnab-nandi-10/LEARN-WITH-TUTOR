const enrollment_service=require("../services/enrollment_service")
const enroll_course=async(req,res,next)=>{
    try{
        const data=await enrollment_service.enroll_course(
            req.params.course_id,
            req.user
        )
        res.status(201).json({success:true,data})
    }catch(err){next(err)}
}
const get_my_courses=async(req,res,next)=>{
    try{
        const data=await enrollment_service.get_my_courses(req.user)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const unenroll_course=async(req,res,next)=>{
    try{
        const data=await enrollment_service.unenroll_course(
            req.params.course_id,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}
const update_enrollment=async(req,res,next)=>{
    try{
        const data=await enrollment_service.update_enrollment(
            req.params.course_id,
            req.body,
            req.user
        )
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={
    enroll_course,
    get_my_courses,
    unenroll_course,
    update_enrollment
}