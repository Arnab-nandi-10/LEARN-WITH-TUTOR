const Enrollment=require("../models/enrollment_model")
const create_enrollment=(data)=>Enrollment.create(data)

const find_enrollment=(user_id,course_id)=>{
    return Enrollment.findOne({user_id,course_id})
}
const get_user_enrollments=(user_id)=>{
    return Enrollment.find({user_id})
}
const get_user_enrollments_with_courses=(user_id)=>{
    return Enrollment.find({user_id}).populate("course_id").sort({createdAt:-1})
}
const get_course_enrollments=(course_id)=>{
    return Enrollment.find({course_id})
}
const delete_enrollment=(user_id,course_id)=>{
    return Enrollment.findOneAndDelete({user_id,course_id})
}
const update_enrollment=(enrollment_id,data)=>{
    return Enrollment.findByIdAndUpdate(enrollment_id,data,{new:true})
}

module.exports={
    create_enrollment,
    find_enrollment,
    get_user_enrollments,
    get_user_enrollments_with_courses,
    get_course_enrollments,
    delete_enrollment,
    update_enrollment
}
