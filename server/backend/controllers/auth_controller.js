const auth_service=require("../services/auth_service")

const signup=async(req,res,next)=>{
    try{
        const data=await auth_service.signup(req.body)
        res.status(201).json({success:true,data})
    }catch(err){next(err)}
}

const login=async(req,res,next)=>{
    try{
        const data=await auth_service.login(req.body)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

const refresh=async(req,res,next)=>{
    try{
        const data=await auth_service.refresh(req.body.refresh_token)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

const logout=async(req,res,next)=>{
    try{
        const data=await auth_service.logout(req.body.refresh_token)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

const get_current_user=async(req,res,next)=>{
    try{
        const data=await auth_service.get_current_user(req.user.id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={signup,login,refresh,logout,get_current_user}
