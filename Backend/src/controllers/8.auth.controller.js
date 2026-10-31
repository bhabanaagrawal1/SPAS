// 5 => entire

// Controller handles HTTP. Service handles business logic.

/*
🧠 Dependency on which files : config.js, catchAsync.js, auth.service.js
 */

/**
controller should mainly deal with:

req
res
reading req.body
reading req.query
setting cookies
sending HTTP responses
calling the service

Controller
  ↓
extracts HTTP information
  ↓
Service receives normal data

 */

/**
If something throws inside: await registerUser(...) catchAsync handles the error.
 */
import { ApiError, catchAsync } from "../utils/3.catchAsync.js";
import { registerUser,verifyUserEmail,loginUser,refreshTokens,logoutUser,getCurrentUser,changeUserPassword,forgotPassword,resetPassword,resendVerificationEmail } from "../services/9.auth.service.js";
import config from "../config/config.js";


export const register = catchAsync(async (req, res) => {
    // destructuring
    const { email, password,registrationId } = req.body;
    // This means: "Service, here is the information you need. Please perform registration."
    /**
    result
    │
    ├── accessToken
    ├── refreshToken
    └── user
        ├── id
        ├── email
        └── isEmailVerified
     */
    const result = await registerUser({
        email,
        password,
        registrationId,
        /**
        The browser/client sends a User-Agent HTTP header.
        It can contain information about the client, such as browser/device details.
        Your service needs this because your refresh-token table stores: userAgent
        So the controller extracts it from the HTTP request and passes it as normal data.
        */
        userAgent: req.headers["user-agent"],
        /**
        Express gives you the request IP.
        Your service can then store it in the refresh-token record.
         */
        ipAddress: req.ip
    });

    res.status(201).json({ message: result.message, user: result.user });
});


export const verifyEmail = catchAsync(async (req, res) => {
    // token ko destructure kiya 
    /**
    General syntax

    If the URL is:
    /path?key=value

    then you access it with: req.query.key

    This is simpler, but the token remains in the API URL.

    Design B — Frontend handles the link

    Email
    ↓
    http://localhost:5173/verify-email?token=ABC123
    ↓
    Frontend /verify-email page
    ↓
    extract ABC123
    ↓
    POST /api/auth/verify-email
    ↓
    {
        "token": "ABC123"
    }
    ↓
    Backend verifies token

    2. Why does the verify-email endpoint accept a POST with the token in the body, rather than a GET with the token as a query param?
    Tokens in URLs end up logged in browser history, server access logs, and the Referer header sent to any third-party resources the page loads — all places you don't want a sensitive one-time secret sitting around. A POST body isn't logged by default in the same way. (In practice, the link in the email itself is a GET-style URL for the user to click — but the frontend page it lands on should immediately extract the token and send it via POST to the API, not have the API itself accept it as a GET query param.)

     */
    const { token } = req.body;
    // agar token present nahi hai
    if(!token) {
        throw new ApiError(400,"Verification token is required")
    }
    // token agar hai toh services mai verifyUserEmail function ko bhejo
    const result = await verifyUserEmail({ token,userAgent: req.headers["user-agent"],ipAddress: req.ip });

    res.cookie(config.cookie.refreshTokenName,result.refreshToken,config.cookie.options);

    res.status(200).json({
        message: result.message,
        accessToken: result.accessToken,
        user: result.user
    })
});

export const resendVerification = catchAsync(async (req,res) => {
    // destructure the correct email
    const { email } = req.body;
    // if not email
    if(!email) {
        throw new ApiError(400,"Email is required")
    }
    // 
    const result = await resendVerificationEmail({email});
    res.status(200).json(result);
})

export const login = catchAsync(async (req,res) => {
    const {email,password} =  req.body;
    const result = await loginUser({
        email,
        password,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip
    })
    res.cookie(
        config.cookie.refreshTokenName,
        result.refreshToken,
        config.cookie.options
    );
    res.json({
        accessToken: result.accessToken,
        user: result.user
    });
})

/**
Why refreshTokens takes the raw token as a plain argument (incomingToken) rather than reading req.cookies itself — same architectural boundary as before: the service layer never touches req. The controller's entire job here is extracting the cookie by name and handing off a plain string. This is a good one to notice as validation that the service/controller split is holding up correctly even for a route as fiddly as refresh — the cookie-reading is genuinely the only Express-specific thing this route needs, and it stays in the controller.
 */
export const refresh = catchAsync(async (req, res) => {
    // From the cookies sent by the browser, get the cookie whose name is cookieName
    /**
     * Browser
        │
        │ Cookie: refreshToken = ABC123
        ▼
        Express
        │
        ▼
        req.cookies
        │
        └── refreshToken: "ABC123"
                            ↓
                incomingToken = "ABC123"
        If req.cookies doesn't exist, it won't crash with: Cannot read properties of undefined
     */
    const incomingToken = req.cookies?.[config.cookie.refreshTokenName];

    const result = await refreshTokens({
        incomingToken,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
    });

    res.cookie(config.cookie.refreshTokenName, result.refreshToken, config.cookie.options);

    res.status(200).json({ accessToken: result.accessToken,user: result.user });
});


export const logout = catchAsync(async (req,res) => {
    const incomingToken = req.cookies?.[config.cookie.refreshTokenName]

    const result = await logoutUser({ incomingToken });

    res.clearCookie(config.cookie.refreshTokenName, config.cookie.options)

    res.status(200).json({
        message: "Logged out successfully"
    });
})

export const me = catchAsync(async (req,res) => {
    const result = await getCurrentUser({ userId: req.user.id })
    res.json(result);
})

export const changePassword = catchAsync(async (req,res) => {
    const { currentPassword, newPassword } = req.body

    const result = await changeUserPassword({
        userId: req.user.id,
        currentPassword,
        newPassword
    })

    res.clearCookie(config.cookie.refreshTokenName,config.cookie.options)

    res.json(result);
})

export const forgotPasswordHandler = catchAsync(async (req,res) => {
    const {email} = req.body;
    const result = await forgotPassword({email});
    res.json(result);
})

export const resetPasswordHandler = catchAsync(async (req,res) => {
    const {token,newPassword} = req.body;
    const result = await resetPassword({ token,newPassword });
    res.json(result);
})