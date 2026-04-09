const Course=require("../models/course_model")
const create_course=(data)=>Course.create(data)
const update_course=(id,data)=>Course.findByIdAndUpdate(id,data,{new:true})
const get_course_by_id=(id)=>Course.findById(id)
const delete_course=(id)=>Course.findByIdAndDelete(id)
const Lesson=require("../models/lesson_model")

const update_course_duration=async(course_id)=>{
    const modules=await Module.find({course_id})
    const module_ids=modules.map(m=>m._id)
    const lessons=await Lesson.find({module_id:{$in:module_ids}})
    const total=lessons.reduce((sum,l)=>sum+(l.duration||0),0)
    return Course.findByIdAndUpdate(course_id,{total_duration:total},{new:true})
}
const get_courses_by_faculty=(faculty_id)=>{
    return Course.find({faculty_id})
}
const get_all_published_courses=()=>{
    return Course.find({
        status:"published",
        isApproved:{$ne:false}
    })
}

module.exports={
    create_course,
    update_course,
    get_course_by_id,
    delete_course,
    get_courses_by_faculty,
    get_all_published_courses,
    update_course_duration
}
