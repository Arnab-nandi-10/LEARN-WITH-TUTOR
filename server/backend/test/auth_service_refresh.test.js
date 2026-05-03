const test=require("node:test")
const assert=require("node:assert/strict")
const path=require("node:path")
const jwt=require("jsonwebtoken")

const servicePath=path.join(__dirname,"../services/auth_service")
const refreshRepoPath=path.join(__dirname,"../repositories/refresh_token_repository")
const userRepoPath=path.join(__dirname,"../repositories/user_repository")
const tokenServicePath=path.join(__dirname,"../services/token_service")

const loadAuthService=(stubs={})=>{
    delete require.cache[require.resolve(servicePath)]

    const refreshRepo=require(refreshRepoPath)
    const userRepo=require(userRepoPath)
    const tokenService=require(tokenServicePath)

    Object.assign(refreshRepo,stubs.refreshRepo||{})
    Object.assign(userRepo,stubs.userRepo||{})
    Object.assign(tokenService,stubs.tokenService||{})

    return require(servicePath)
}

test("refresh returns a new access token when the refresh token is valid",async()=>{
    process.env.JWT_SECRET="test-secret"
    process.env.ACCESS_TOKEN_EXPIRES_IN="15m"

    const refresh_token=jwt.sign({id:"user-1"},process.env.JWT_SECRET,{expiresIn:"7d"})
    const generatedTokens=[]

    const auth_service=loadAuthService({
        refreshRepo:{
            find_token:async(token)=>token===refresh_token?{token}:null,
            delete_token:async()=>null
        },
        userRepo:{
            find_user_by_id:async(id)=>({_id:id,role:"student"})
        },
        tokenService:{
            generate_access_token:(payload)=>{
                generatedTokens.push(payload)
                return "new-access-token"
            }
        }
    })

    const result=await auth_service.refresh(refresh_token)

    assert.equal(result.access_token,"new-access-token")
    assert.deepEqual(generatedTokens,[{id:"user-1",role:"student"}])
})

test("refresh rejects an expired refresh token and removes it from storage",async()=>{
    process.env.JWT_SECRET="test-secret"

    const refresh_token="expired-refresh-token"
    let deletedToken=null

    const originalVerify=jwt.verify
    jwt.verify=()=>{
        const error=new Error("jwt expired")
        error.name="TokenExpiredError"
        throw error
    }

    const auth_service=loadAuthService({
        refreshRepo:{
            find_token:async(token)=>token===refresh_token?{token}:null,
            delete_token:async(token)=>{ deletedToken=token }
        },
        userRepo:{
            find_user_by_id:async()=>({_id:"user-1",role:"student"})
        }
    })

    try{
        await assert.rejects(()=>auth_service.refresh(refresh_token),err=>{
            assert.equal(err.message,"refresh token expired")
            assert.equal(err.status,401)
            return true
        })
    }finally{
        jwt.verify=originalVerify
    }

    assert.equal(deletedToken,refresh_token)
})