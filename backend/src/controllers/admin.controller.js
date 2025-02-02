import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import Wallet from "../models/wallet.models.js";
import { getContainer } from "../db/index.js";

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

    // Only super admins can promote to admin
    if (!req.user.isSuperAdmin) {
        throw new ApiError(403, "Only super admins can promote users to admin");
    }

    try {
        const container = await getContainer();
        
        // Find user
        const querySpec = {
            query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
            parameters: [{ name: "@id", value: id }]
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        const user = resources[0];

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Update user properties
        const updatedUser = {
            ...user,
            isAdmin: true,
            adminRole: adminRole,
            updated_at: new Date()
        };

        const { resource } = await container.items.upsert(updatedUser);
        
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200, 
                    "User promoted to admin successfully",
                    resource
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 400,
            error.message || "Failed to promote user to admin"
        );
    }
});

const revokeAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Only super admins can revoke admin status
    if (!req.user.isSuperAdmin) {
        throw new ApiError(403, "Only super admins can revoke admin status");
    }

    try {
        const container = await getContainer();
        
        // Find user
        const querySpec = {
            query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
            parameters: [{ name: "@id", value: id }]
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        const user = resources[0];

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Prevent revoking super admin status from the last super admin
        if (user.adminRole === 'super') {
            // Check if this is the last super admin
            const superAdminQuery = {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'user' AND c.adminRole = 'super'",
            };
            const { resources: superAdminCount } = await container.items.query(superAdminQuery).fetchAll();
            
            if (superAdminCount[0] <= 1) {
                throw new ApiError(403, "Cannot revoke the last super admin's status");
            }
        }

        // Update user properties
        const updatedUser = {
            ...user,
            isAdmin: false,
            isSuperAdmin: false,
            adminRole: null,
            updated_at: new Date()
        };

        const { resource } = await container.items.upsert(updatedUser);
        
        return res
            .status(200)
            .json(new ApiResponse(200, "Admin access revoked successfully", resource));
    } catch (error) {
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

const getSystemStats = asyncHandler(async (req, res) => {
    try {
        const container = await getContainer();
        
        // Get counts for different document types
        const statsQueries = [
            {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'user'",
                name: "totalUsers"
            },
            {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'wallet'",
                name: "totalWallets"
            },
            {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'transaction'",
                name: "totalTransactions"
            },
            {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'nft'",
                name: "totalNFTs"
            }
        ];

        const stats = {};
        for (const query of statsQueries) {
            const { resources } = await container.items.query(query.query).fetchAll();
            stats[query.name] = resources[0] || 0;
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "System stats retrieved successfully", stats));
    } catch (error) {
        throw new ApiError(500, "Failed to retrieve system stats");
    }
});

const getAdminLogs = asyncHandler(async (req, res) => {
    try {
        const container = await getContainer();
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const querySpec = {
            query: "SELECT * FROM c WHERE c.type = 'adminLog' ORDER BY c.timestamp DESC OFFSET @offset LIMIT @limit",
            parameters: [
                { name: "@offset", value: offset },
                { name: "@limit", value: parseInt(limit) }
            ]
        };

        const { resources: logs } = await container.items.query(querySpec).fetchAll();

        return res
            .status(200)
            .json(new ApiResponse(200, "Admin logs retrieved successfully", logs));
    } catch (error) {
        throw new ApiError(500, "Failed to retrieve admin logs");
    }
});

const updateAdminSettings = asyncHandler(async (req, res) => {
    try {
        const container = await getContainer();
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            throw new ApiError(400, "Invalid settings data");
        }

        const settingsDoc = {
            id: 'admin-settings',
            type: 'settings',
            ...settings,
            updated_at: new Date(),
            updated_by: req.user.id
        };

        const { resource } = await container.items.upsert(settingsDoc);
        
        return res
            .status(200)
            .json(new ApiResponse(200, "Admin settings updated successfully", resource));
    } catch (error) {
        throw new ApiError(500, "Failed to update admin settings");
    }
});

export {
    getAdminDashboard,
    promoteToAdmin,
    revokeAdmin,
    getAllUsers,
    getSystemStats,
    getAdminLogs,
    updateAdminSettings
}; 