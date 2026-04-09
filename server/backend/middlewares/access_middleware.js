const enrollment_repo=require("../repositories/enrollment_repository")
const course_repo=require("../repositories/course_repository")
const AppError=require("../utils/app_error")

const check_course_access=async(req,res,next)=>{
    try{
        const user=req.user
        const course_id=req.params.course_id
        const course=await course_repo.get_course_by_id(course_id)
        if(!course){
            throw new AppError("course not found",404)
        }
        if(user.role==="admin"){
            return next()
        }
        if(user.role==="faculty"){
            if(course.faculty_id.toString()!==user.id.toString()){
                throw new AppError("not authorized",403)
            }
            return next()
        }
        const enrollment=await enrollment_repo.find_enrollment(user.id,course_id)
        if(!enrollment){
            throw new AppError("access denied",403)
        }
        next()
    }catch(err){
        next(err)
    }
}

module.exports={check_course_access}
