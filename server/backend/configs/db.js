const mongoose=require("mongoose")

const connect_with_uri=async(uri,label)=>{
    await mongoose.connect(uri,{serverSelectionTimeoutMS:10000})
    console.log(`mongodb connected via ${label}`)
}

const connect_db=async()=>{
    const primary_uri=process.env.MONGO_URI
    const fallback_uri=process.env.MONGO_URI_DIRECT

    try{
        await connect_with_uri(primary_uri,"srv")
    }catch(err){
        const is_srv_issue=String(err?.message||"").toLowerCase().includes("querysrv")
        if(is_srv_issue && fallback_uri){
            console.warn("SRV DNS resolution failed, retrying with direct Mongo URI...")
            try{
                await connect_with_uri(fallback_uri,"direct")
                return
            }catch(fallback_err){
                console.error("MongoDB fallback connection failed:",fallback_err.message)
                process.exit(1)
            }
        }

        console.error("MongoDB connection failed:",err.message)
        process.exit(1)
    }
}

module.exports=connect_db