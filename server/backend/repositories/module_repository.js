const Module=require("../models/module_model")
const create_module=(data)=>Module.create(data)
const get_modules_by_course=(course_id)=>{
    return Module.find({course_id}).sort({order:1})
}
const get_last_module=(course_id)=>{
    return Module.findOne({course_id}).sort({order:-1})
}
const update_module=(id,data)=>{
    return Module.findByIdAndUpdate(id,data,{new:true})
}
const get_module_by_id=(id)=>{
    return Module.findById(id)
}
const delete_module=(id)=>{
    return Module.findByIdAndDelete(id)
}
const get_modules_with_lessons=async(course_id)=>{
    const Lesson=require("../models/lesson_model")
    const modules=await Module.find({course_id}).sort({order:1}).lean()
    const module_ids=modules.map(m=>m._id)
    const lessons=await Lesson.find({module_id:{$in:module_ids}}).sort({order:1}).lean()
    const lesson_map={}
    lessons.forEach(l=>{
        if(!lesson_map[l.module_id]) lesson_map[l.module_id]=[]
        lesson_map[l.module_id].push(l)
    })
    return modules.map(m=>({
        ...m,
        lessons:lesson_map[m._id]||[]
    }))
}

module.exports={
    create_module,
    get_modules_by_course,
    get_last_module,
    update_module,
    get_module_by_id,
    delete_module,
    get_modules_with_lessons
}