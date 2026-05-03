const test=require("node:test")
const assert=require("node:assert/strict")
const jwt=require("jsonwebtoken")

const loadTokenService=()=>{
    delete require.cache[require.resolve("../services/token_service")]
    return require("../services/token_service")
}

test("generate_access_token uses configurable expiry",()=>{
    process.env.JWT_SECRET="test-secret"
    process.env.ACCESS_TOKEN_EXPIRES_IN="10m"
    const token_service=loadTokenService()

    const token=token_service.generate_access_token({id:"user-1"})
    const decoded=jwt.decode(token)

    assert.ok(decoded)
    assert.equal(decoded.id,"user-1")
    assert.equal(decoded.exp-decoded.iat,10*60)
})

test("generate_refresh_token uses configurable expiry",()=>{
    process.env.JWT_SECRET="test-secret"
    process.env.REFRESH_TOKEN_EXPIRES_IN="3d"
    const token_service=loadTokenService()

    const token=token_service.generate_refresh_token({id:"user-1"})
    const decoded=jwt.decode(token)

    assert.ok(decoded)
    assert.equal(decoded.id,"user-1")
    assert.equal(decoded.exp-decoded.iat,3*24*60*60)
})