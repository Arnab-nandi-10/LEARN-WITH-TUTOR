const {PutObjectCommand,HeadObjectCommand,DeleteObjectCommand}=require("@aws-sdk/client-s3")
const {getSignedUrl}=require("@aws-sdk/s3-request-presigner")
const s3=require("../configs/aws_config")
const crypto=require("crypto")
const AppError=require("../utils/app_error")

const generate_upload_url=async(file_type)=>{
    const file_name=`videos/${crypto.randomBytes(16).toString("hex")}`
    const command=new PutObjectCommand({
        Bucket:process.env.AWS_BUCKET_NAME,
        Key:file_name,
        ContentType:file_type
    })
    const upload_url=await getSignedUrl(s3,command,{expiresIn:300})
    const file_url=`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file_name}`
    return {
        upload_url,
        file_url,
        file_key:file_name
    }
}
const get_file_info=async(file_key)=>{
    try{
        const command=new HeadObjectCommand({
            Bucket:process.env.AWS_BUCKET_NAME,
            Key:file_key
        })
        const response=await s3.send(command)
        return {
            size:response.ContentLength,
            type:response.ContentType,
            last_modified:response.LastModified,
            exists:true
        }
    }catch(err){
        if(err.name==="NotFound"){
            throw new AppError("file not found",404)
        }
        throw err
    }
}
const delete_file=async(file_key,user)=>{
    if(user.role!=="faculty") throw new AppError("only faculty can delete files",403)
    try{
        const command=new DeleteObjectCommand({
            Bucket:process.env.AWS_BUCKET_NAME,
            Key:file_key
        })
        await s3.send(command)
        return {message:"file deleted successfully"}
    }catch(err){
        if(err.name==="NotFound"){
            throw new AppError("file not found",404)
        }
        throw err
    }
}

module.exports={generate_upload_url,get_file_info,delete_file}