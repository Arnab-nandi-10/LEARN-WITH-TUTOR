const Lesson=require("../models/lesson_model")
const create_lesson=(data)=>Lesson.create(data)
const get_lessons_by_module=(module_id)=>{
    return Lesson.find({module_id}).sort({order:1})
}
const get_last_lesson=(module_id)=>{
    return Lesson.findOne({module_id}).sort({order:-1})
}
const update_lesson=(id,data)=>{
    return Lesson.findByIdAndUpdate(id,data,{new:true})
}
const get_lesson_by_id=(id)=>{
    return Lesson.findById(id)
}
const delete_lesson=(id)=>{
    return Lesson.findByIdAndDelete(id)
}
const get_lessons_by_module_ids=(module_ids)=>{
    return Lesson.find({module_id:{$in:module_ids}})
}

module.exports={
    create_lesson,
    get_lessons_by_module,
    get_last_lesson,
    update_lesson,
    get_lesson_by_id,
    delete_lesson,
    get_lessons_by_module_ids
}