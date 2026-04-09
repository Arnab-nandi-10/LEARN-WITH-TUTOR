const mongoose=require("mongoose")

const refresh_token_schema=new mongoose.Schema({
    user_id:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    token:{type:String,required:true},
    expires_at:{type:Date,required:true}
},{timestamps:true})

module.exports=mongoose.model("RefreshToken",refresh_token_schema)