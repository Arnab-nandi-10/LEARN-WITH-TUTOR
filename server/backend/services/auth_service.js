const bcrypt=require("bcryptjs")
const user_repo=require("../repositories/user_repository")
const token_service=require("./token_service")
const refresh_repo=require("../repositories/refresh_token_repository")
const AppError=require("../utils/app_error")
const jwt=require("jsonwebtoken")

const normalize_email=(email)=>String(email||"").trim().toLowerCase()

const can_signup_as_admin=async()=>{
    if(process.env.ALLOW_ADMIN_SIGNUP==="true"){
        return true
    }

    const existing_admins=await user_repo.count_users_by_role("admin")
    return existing_admins===0
}

const sanitize_user=(user)=>{
    const user_obj=user.toObject()
    delete user_obj.password
    return user_obj
}

const signup=async(data)=>{
    const normalized_email=normalize_email(data.email)
    const existing=await user_repo.find_user_by_email(normalized_email)
    if(existing) throw new AppError("user already exists",400)

    if(data.role==="admin" && !(await can_signup_as_admin())){
        throw new AppError("admin signup is disabled",403)
    }

    const hashed=await bcrypt.hash(data.password,10)

    const user=await user_repo.create_user({
        ...data,
        email:normalized_email,
        password:hashed
    })

    const access_token=token_service.generate_access_token({id:user._id,role:user.role})
    const refresh_token=token_service.generate_refresh_token({id:user._id})

    await refresh_repo.create_token({
        user_id:user._id,
        token:refresh_token,
        expires_at:new Date(Date.now()+7*24*60*60*1000)
    })

    return {user:sanitize_user(user),access_token,refresh_token}
}

const login=async(data)=>{
    const normalized_email=normalize_email(data.email)
    const user=await user_repo.find_user_by_email(normalized_email)
    if(!user) throw new AppError("invalid credentials",400)

    const match=await bcrypt.compare(data.password,user.password)
    if(!match) throw new AppError("invalid credentials",400)

    const access_token=token_service.generate_access_token({id:user._id,role:user.role})
    const refresh_token=token_service.generate_refresh_token({id:user._id})

    await refresh_repo.create_token({
        user_id:user._id,
        token:refresh_token,
        expires_at:new Date(Date.now()+7*24*60*60*1000)
    })

    return {user:sanitize_user(user),access_token,refresh_token}
}

const refresh=async(token)=>{
    const existing=await refresh_repo.find_token(token)
    if(!existing) throw new AppError("invalid refresh token",401)

    let decoded
    try{
        decoded=jwt.verify(token,process.env.JWT_SECRET)
    }catch(err){
        // If the refresh token is expired or invalid, remove it from DB and return a clear error
        try{ await refresh_repo.delete_token(token) }catch(_){}
        if(err.name==="TokenExpiredError"){
            throw new AppError("refresh token expired",401)
        }
        throw new AppError("invalid refresh token",401)
    }

    const user=await user_repo.find_user_by_id(decoded.id)
    if(!user) throw new AppError("user not found",404)

    const new_access=token_service.generate_access_token({
        id:decoded.id,
        role:user.role
    })

    return {access_token:new_access}
}

const logout=async(token)=>{
    await refresh_repo.delete_token(token)
    return {message:"logged out"}
}

const get_current_user=async(user_id)=>{
    const user=await user_repo.find_user_by_id(user_id)
    if(!user) throw new AppError("user not found",404)
    return sanitize_user(user)
}

module.exports={signup,login,refresh,logout,get_current_user}
