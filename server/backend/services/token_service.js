const jwt=require("jsonwebtoken")

const generate_access_token=(payload)=>{
    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"15m"})
}

const generate_refresh_token=(payload)=>{
    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"7d"})
}

module.exports={generate_access_token,generate_refresh_token}