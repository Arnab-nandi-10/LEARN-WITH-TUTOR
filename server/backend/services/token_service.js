const jwt=require("jsonwebtoken")

const access_token_expires_in=process.env.ACCESS_TOKEN_EXPIRES_IN||"15m"
const refresh_token_expires_in=process.env.REFRESH_TOKEN_EXPIRES_IN||"7d"

const generate_access_token=(payload)=>{
    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:access_token_expires_in})
}

const generate_refresh_token=(payload)=>{
    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:refresh_token_expires_in})
}

module.exports={generate_access_token,generate_refresh_token}