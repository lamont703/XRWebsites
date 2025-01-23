import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const isAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user?.isAdmin) {
        throw new ApiError(403, "Admin access required");
    }
    next();
});

// Optional: More specific admin role checks
export const hasAdminRole = (requiredRole) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user?.isAdmin || req.user?.adminRole !== requiredRole) {
            throw new ApiError(403, `${requiredRole} admin access required`);
        }
        next();
    });
}; 