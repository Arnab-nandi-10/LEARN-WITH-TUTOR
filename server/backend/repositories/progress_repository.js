const Progress=require("../models/progress_model")
const mark_completed=(data)=>Progress.create(data)
const find_progress=(user_id,lesson_id)=>{
    return Progress.findOne({user_id,lesson_id})
}
const get_course_progress=(user_id,course_id)=>{
    return Progress.find({user_id,course_id})
}
const get_all_course_progress=(course_id)=>{
    return Progress.find({course_id})
}
const delete_course_progress=(user_id,course_id)=>{
    return Progress.deleteMany({user_id,course_id})
}
const update_progress=(progress_id,data)=>{
    return Progress.findByIdAndUpdate(progress_id,data,{new:true})
}

module.exports={
    mark_completed,
    find_progress,
    get_course_progress,
    get_all_course_progress,
    delete_course_progress,
    update_progress
}