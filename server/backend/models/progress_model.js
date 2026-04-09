const mongoose=require("mongoose")
const progress_schema=new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    course_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
        required:true
    },
    module_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Module",
        required:true
    },
    lesson_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Lesson",
        required:true
    },
    completed:{
        type:Boolean,
        default:true
    }
},{timestamps:true})
progress_schema.index({user_id:1,lesson_id:1},{unique:true})

module.exports=mongoose.model("Progress",progress_schema)