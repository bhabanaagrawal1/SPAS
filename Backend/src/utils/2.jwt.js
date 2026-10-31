//2 -> entire

/*
🧠 Dependency on which files : config.js
🧠 function expressions: signAccessToken,signRefreshToken,verifyAccessToken,verifyRefreshToken,refreshTokenExpiryDate
 */

import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/config.js";

// ✔️ jwt.sign(payload, secretKey, options)

// Create a short-lived access token
const signAccessToken = (payload) => {
    return jwt.sign(payload,config.jwt.accessSecret,{
        expiresIn: config.jwt.accessExpiresIn
    })
}

// Create a long-lived refresh token
const signRefreshToken = (payload) => {
    return jwt.sign({...payload,jti: crypto.randomUUID()},config.jwt.refreshSecret,{
        expiresIn: config.jwt.refreshExpiresIn
    })
}

// ✔️ jwt.verify(token, secretKey)

//VERIFY THE ACCESS tOKEN
const verifyAccessToken = (token) => {
    return jwt.verify(token,config.jwt.accessSecret);
}

//VERIFY REFRESH TOKEN
const verifyRefreshToken = (token) => {
    return jwt.verify(token,config.jwt.refreshSecret)
}


// ✔️ new Date(Date.now() + timeInMilliseconds)
// Calculate refresh token expiry date
const refreshTokenExpiryDate = () => {
    return new Date(Date.now() + 7*24*60*60*1000);
}

export {signAccessToken,signRefreshToken,verifyAccessToken,verifyRefreshToken,refreshTokenExpiryDate};