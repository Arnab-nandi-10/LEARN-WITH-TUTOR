const mongoose=require("mongoose")

const module_schema=new mongoose.Schema({
    course_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
        required:true
    },
    title:{type:String,required:true},
    order:{type:Number,required:true},
    total_lessons:{type:Number,default:0}
},{timestamps:true})

module_schema.index({course_id:1})
module_schema.index({course_id:1,order:1})

module.exports=mongoose.model("Module",module_schema)