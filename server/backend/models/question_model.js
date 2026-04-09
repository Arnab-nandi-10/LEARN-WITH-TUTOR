const mongoose=require("mongoose")
const question_schema=new mongoose.Schema({
    exam_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Exam",
        required:true
    },
    question_text:{type:String,required:true},
    options:[
        {
            text:String
        }
    ],
    correct_answer:{type:Number,required:true},
    marks:{type:Number,default:1}
},{timestamps:true})
question_schema.index({exam_id:1})

module.exports=mongoose.model("Question",question_schema)