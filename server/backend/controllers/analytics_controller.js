const analytics_service=require("../services/analytics_service")

const get_course_analytics=async(req,res,next)=>{
    try{
        const data=await analytics_service.get_course_analytics(req.params.course_id)
        res.status(200).json({success:true,data})
    }catch(err){next(err)}
}

module.exports={get_course_analytics}