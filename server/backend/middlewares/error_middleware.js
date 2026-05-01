const error_middleware=(err,req,res,next)=>{
    const status=err.status||500
    const message=err.message||"internal server error"
    
    // Log errors for debugging
    if(status===500){
        console.error("⚠️ Server Error:", {
            status,
            message,
            stack: err.stack
        })
    } else {
        console.warn("⚠️ Client Error:", {
            status,
            message
        })
    }
    
    res.status(status).json({
        success:false,
        message,
        // Only expose error details in development
        ...(process.env.NODE_ENV==='development' && {error:err.toString()})
    })
}

module.exports=error_middleware