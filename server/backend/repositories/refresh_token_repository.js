const RefreshToken=require("../models/refresh_token_model")

const create_token=(data)=>RefreshToken.create(data)
const find_token=(token)=>RefreshToken.findOne({token})
const delete_token=(token)=>RefreshToken.deleteOne({token})
const delete_user_tokens=(user_id)=>RefreshToken.deleteMany({user_id})

module.exports={
    create_token,
    find_token,
    delete_token,
    delete_user_tokens
}