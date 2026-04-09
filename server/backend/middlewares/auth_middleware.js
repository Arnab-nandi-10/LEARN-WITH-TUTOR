const jwt=require("jsonwebtoken")

const protect=async(req,res,next)=>{
    try{
        const token=req.headers.authorization?.split(" ")[1]
        if(!token) throw {status:401,message:"not authorized"}

        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        req.user=decoded
        next()
    }catch(err){
        next({status:401,message:"invalid token"})
    }
}

const authorize=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next({status:403,message:"forbidden"})
        }
        next()
    }
}

module.exports={protect,authorize}