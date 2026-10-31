import { verifyAccessToken } from "../utils/2.jwt.js";
import { ApiError } from "../utils/3.catchAsync.js";

export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError(401, "Authentication required"));
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, email: payload.email,role: payload.role };
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new ApiError(401, "Access token expired"));
        }
        return next(new ApiError(401, "Invalid access token"));
    }
}