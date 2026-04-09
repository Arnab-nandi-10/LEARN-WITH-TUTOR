require("dotenv").config()
const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")
const User=require("../models/user_model")

const admin_name=process.env.LOCAL_ADMIN_NAME || "Tutor Local Admin"
const admin_email=String(
    process.env.LOCAL_ADMIN_EMAIL || "local-admin@tutor.dev"
).trim().toLowerCase()
const admin_password=process.env.LOCAL_ADMIN_PASSWORD || "Admin@123456"

const run=async()=>{
    await mongoose.connect(process.env.MONGO_URI)

    const hashed_password=await bcrypt.hash(admin_password,10)
    const user=await User.findOneAndUpdate(
        {email:admin_email},
        {
            name:admin_name,
            email:admin_email,
            password:hashed_password,
            role:"admin"
        },
        {
            upsert:true,
            new:true,
            setDefaultsOnInsert:true
        }
    )

    console.log(
        JSON.stringify(
            {
                success:true,
                admin:{
                    id:String(user._id),
                    email:user.email,
                    role:user.role
                },
                credentials:{
                    email:admin_email,
                    password:admin_password
                }
            },
            null,
            2
        )
    )
}

run()
    .then(async()=>{
        await mongoose.disconnect()
    })
    .catch(async(err)=>{
        console.error(err)
        try{
            await mongoose.disconnect()
        }catch{}
        process.exit(1)
    })
