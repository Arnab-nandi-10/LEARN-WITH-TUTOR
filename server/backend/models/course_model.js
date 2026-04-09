const mongoose=require("mongoose")

const course_schema=new mongoose.Schema({
    title:{type:String,required:true},
    description:{type:String,required:true},
    thumbnail_url:{type:String},
    category:{type:String,required:true},
    price:{type:Number,default:0},
    faculty_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        enum:["draft","published"],
        default:"draft"
    },
    total_modules:{type:Number,default:0},
    total_duration:{type:Number,default:0},
    isApproved:{
        type:Boolean
    }
},{timestamps:true})

course_schema.index({faculty_id:1})
course_schema.index({category:1})

module.exports=mongoose.model("Course",course_schema)
