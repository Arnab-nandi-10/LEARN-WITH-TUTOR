const validate=(schema)=>(req,res,next)=>{
    const {error}=schema.validate(req.body)
    if(error){
        console.error("❌ Validation Error:", {
            message: error.details[0].message,
            field: error.details[0].path,
            received_body: req.body
        })
        return next({status:400,message:error.details[0].message})
    }
    next()
}

module.exports=validate