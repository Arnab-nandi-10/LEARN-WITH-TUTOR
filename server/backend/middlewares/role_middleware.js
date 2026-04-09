const AppError=require("../utils/app_error")
const restrict_to=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError("not authorized",403))
        }
        next()
    }
}
module.exports={restrict_to}