import { ApiError } from "../utils/3.catchAsync";

export function requireRole(...allowedRoles) {
    return (req,res,next) => {
        if(!req.user || !req.user.role) {
            return next(new ApiError(401,"Authentication required"));
        }
        if(!allowedRoles.includes(req,user.role)){
            return next(new ApiError(403,"You do not have permission to perform this action"));
        }
        next();
    }
}