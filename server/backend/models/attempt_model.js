const mongoose=require("mongoose")
const attempt_schema=new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    exam_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Exam",
        required:true
    },
    answers:[
        {
            question_id:String,
            selected_option:Number
        }
    ],
    score:{type:Number,default:0},
    status:{
        type:String,
        enum:["pending","completed"],
        default:"completed"
    }
},{timestamps:true})
attempt_schema.index({user_id:1,exam_id:1})

module.exports=mongoose.model("Attempt",attempt_schema)