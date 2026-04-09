const mongoose=require("mongoose")

const enrollment_schema=new mongoose.Schema({
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
    status:{
        type:String,
        enum:["active","completed"],
        default:"active"
    },
    enrolled_at:{
        type:Date,
        default:Date.now
    }
},{timestamps:true})

enrollment_schema.index({user_id:1,course_id:1},{unique:true})

module.exports=mongoose.model("Enrollment",enrollment_schema)