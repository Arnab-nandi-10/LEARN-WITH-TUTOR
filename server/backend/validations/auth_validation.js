const Joi=require("joi")

const signup_schema=Joi.object({
    name:Joi.string().required(),
    email:Joi.string().trim().lowercase().email().required(),
    password:Joi.string().min(6).required(),
    role:Joi.string().valid("student","faculty","admin")
})

const login_schema=Joi.object({
    email:Joi.string().trim().lowercase().email().required(),
    password:Joi.string().required()
})

module.exports={signup_schema,login_schema}
