const mongoose=require("mongoose")

const exam_schema=new mongoose.Schema({
    course_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
        required:true
    },
    module_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Module",
        default:null
    },
    title:{type:String,required:true},
    total_marks:{type:Number,default:0},
    time_limit:{type:Number}, // in minutes
    passing_marks:{type:Number,default:0}
},{timestamps:true})

exam_schema.index({course_id:1})
exam_schema.index({module_id:1})

module.exports=mongoose.model("Exam",exam_schema)