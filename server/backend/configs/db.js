const mongoose=require("mongoose")

const connect_db=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("mongodb connected")
    }catch(err){
        console.log(err.message)
        process.exit(1)
    }
}

module.exports=connect_db