const express=require("express")
const cors=require("cors")
const morgan=require("morgan")
const error_middleware=require("./middlewares/error_middleware")
const auth_routes=require("./routes/auth_routes")
const {protect}=require("./middlewares/auth_middleware")
const course_routes=require("./routes/course_routes")
const module_routes=require("./routes/module_routes")
const lesson_routes=require("./routes/lesson_routes")
const enrollment_routes=require("./routes/enrollment_routes")
const progress_routes=require("./routes/progress_routes")
const exam_routes=require("./routes/exam_routes")
const question_routes=require("./routes/question_routes")
const attempt_routes=require("./routes/attempt_routes")
const analytics_routes=require("./routes/analytics_routes")
const upload_routes=require("./routes/upload_routes")
const user_routes=require("./routes/user_routes")
const admin_user_manage_routes=require("./routes/admin/admin.userManage.routes")
const admin_course_routes=require("./routes/admin/adminCourse.route")
const admin_refund_routes=require("./routes/admin/adminRefund.routes")
const admin_payment_routes=require("./routes/admin/adminPayment.routers")
const admin_coupon_routes=require("./routes/admin/adminCoupon.routes")
const payment_routes=require("./routes/payment.routes")
const refund_routes=require("./routes/refund.routes")

const app=express()
const allowed_origins=new Set(
    [
        process.env.FRONTEND_URL,
        process.env.NEXT_PUBLIC_FRONTEND_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ].filter(Boolean)
)

// CORS must be first - allow known local frontend origins and configured frontend URLs
app.use(cors({
    origin:(origin,callback)=>{
        if(!origin || allowed_origins.has(origin)){
            return callback(null,true)
        }

        return callback(new Error(`CORS blocked for origin ${origin}`))
    },
    credentials: true
}))

app.use(express.json())
app.use("/api/auth",auth_routes)

app.use("/api/courses",course_routes)
app.use(morgan("dev"))
app.get("/api/test/protected",protect,(req,res)=>{
    res.json({success:true,user:req.user})
})
app.use("/api/exams",exam_routes)
app.use("/api/questions",question_routes)
app.use("/api/progress",progress_routes)
app.use("/api/enrollments",enrollment_routes)
app.use("/api/modules/:module_id/lessons",lesson_routes)
app.use("/api/courses/:course_id/modules",module_routes)
app.use("/api/analytics",analytics_routes)
app.use("/api/attempts",attempt_routes)
app.use("/api/upload",upload_routes)
app.use("/api/users",user_routes)
app.use("/api/admin/users",admin_user_manage_routes)
app.use("/api/admin/courses",admin_course_routes)
app.use("/api/admin/refunds",admin_refund_routes)
app.use("/api/admin",admin_payment_routes)
app.use("/api/admin/coupons",admin_coupon_routes)
app.use("/api/payment",payment_routes)
app.use("/api/refund",refund_routes)
app.get("/",(req,res)=>res.send("API running"))

app.use(error_middleware)

module.exports=app
