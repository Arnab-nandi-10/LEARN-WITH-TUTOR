const mongoose=require("mongoose")

const lesson_schema=new mongoose.Schema({
    module_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Module",
        required:true
    },
    title:{type:String,required:true},
    type:{
        type:String,
        enum:["video","text","file"],
        required:true
    },
    content_url:{type:String},
    content_text:{type:String},
    order:{type:Number,required:true},
    duration:{type:Number,default:0},
    is_preview:{type:Boolean,default:false}
},{timestamps:true})

lesson_schema.index({module_id:1})
lesson_schema.index({module_id:1,order:1})

module.exports=mongoose.model("Lesson",lesson_schema)