import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import Wallet from "../models/wallet.models.js";
import { container } from "../models/user.models.js";

const getAdminDashboard = asyncHandler(async (req, res) => {
    try {
        // Verify the user is an admin
        if (!req.user.isAdmin) {
            throw new ApiError(403, "Access denied: Admin only");
        }

        // Get system statistics
        let totalUsers = 0;
        let totalWallets = 0;
        let recentUsers = [];
        let recentWallets = [];

        try {
            // Get total counts
            const users = await User.find();
            totalUsers = users.length;
            
            if (Wallet.find) {
                const wallets = await Wallet.find();
                totalWallets = wallets.length;
            }

            // Get recent items
            recentUsers = users
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            if (Wallet.find) {
                const wallets = await Wallet.find();
                recentWallets = wallets
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5);
            }
        } catch (error) {
            console.error("Error fetching statistics:", error);
        }

        const dashboardData = {
            stats: {
                totalUsers,
                totalWallets,
            },
            recentActivity: {
                users: recentUsers,
                wallets: recentWallets
            }
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Admin dashboard data retrieved successfully",
                    dashboardData
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to retrieve admin dashboard data"
        );
    }
});

const promoteToAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { adminRole = 'admin' } = req.body;

    try {
        const updatedUser = await User.promoteToAdmin(id, adminRole);
        
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200, 
                    "User promoted to admin successfully",
                    updatedUser
                )
            );
    } catch (error) {
        throw new ApiError(400, "Failed to promote user to admin");
    }
});

const revokeAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        console.log("Attempting to revoke admin for user ID:", id);
        
        const user = await User.findById(id);
        console.log("Found user:", user);
        
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Prevent revoking super admin
        if (user.adminRole === 'super') {
            throw new ApiError(403, "Cannot revoke super admin status");
        }

        // Update user properties
        user.isAdmin = false;
        user.adminRole = null;
        user.updatedAt = new Date();

        // Use container.items.upsert instead of updateOne
        const { resource: updatedUser } = await container.items.upsert(user);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Admin access revoked successfully",
                    updatedUser
                )
            );
    } catch (error) {
        console.error("Error in revokeAdmin:", error);
        console.error("User ID attempted:", id);
        throw new ApiError(
            error.statusCode || 400,
            error.message || "Failed to revoke admin access"
        );
    }
});

const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find();
        
        // Remove sensitive information from each user
        const sanitizedUsers = users.map(user => {
            const { password, refreshToken, ...userInfo } = user;
            return userInfo;
        });
        
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Users retrieved successfully",
                    sanitizedUsers
                )
            );
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        throw new ApiError(
            500,
            "Failed to retrieve users: " + (error.message || "Unknown error")
        );
    }
});

export {
    getAdminDashboard,
    promoteToAdmin,
    revokeAdmin,
    getAllUsers
}; 