const jwt=require("jsonwebtoken")

const generate_token=(payload)=>{
    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"7d"})
}

module.exports={generate_token}