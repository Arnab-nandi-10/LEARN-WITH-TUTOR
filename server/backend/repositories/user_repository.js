const User=require("../models/user_model")
const create_user=(data)=>User.create(data)
const find_user_by_email=(email)=>User.findOne({email})
const find_user_by_id=(id)=>User.findById(id)
const find_all_users=()=>User.find()
const count_users_by_role=(role)=>User.countDocuments({role})

module.exports={
    create_user,
    find_user_by_email,
    find_user_by_id,
    find_all_users,
    count_users_by_role
}
