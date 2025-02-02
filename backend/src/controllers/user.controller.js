import asyncHandler from "express-async-handler";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.models.js";
import { uploadToAzureBlob, deleteFromAzureBlob } from "../utils/blobStorage.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import fs from "fs";
import jwt from "jsonwebtoken";
import Wallet from "../models/wallet.models.js";
import NFTAsset from "../models/nftAsset.models.js";
import Job from "../models/job.models.js";
import { getContainer } from "../db/index.js";

const generateTokens = (userId) => {
    try {
        const accessToken = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY }
        );

        const refreshToken = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY }
        );

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500, "Error generating tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, username } = req.body;
    let avatarLocalPath;
    let coverImageLocalPath;
    let avatarUrl;
    let coverImageUrl;
    let createdUser = null;
    let filesDeleted = false;

    const cleanupFiles = async () => {
        if (filesDeleted) return; // Skip if already cleaned up
        
        // Clean up local files
        if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
            fs.unlinkSync(avatarLocalPath);
        }
        if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
            fs.unlinkSync(coverImageLocalPath);
        }

        // Clean up uploaded files
        if (avatarUrl) {
            try {
                await deleteFromAzureBlob(avatarUrl);
            } catch (error) {
                console.error("Error deleting avatar from blob:", error);
            }
        }
        if (coverImageUrl) {
            try {
                await deleteFromAzureBlob(coverImageUrl);
            } catch (error) {
                console.error("Error deleting cover image from blob:", error);
            }
        }

        filesDeleted = true;
    };

    try {
        // 1. Initial validation
        if ([fullName, email, password, username].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        // 2. Check for existing user
        const existedUser = await User.findOne({
            email,
            username,
        });

        if (existedUser) {
            throw new ApiError(409, "User with this email or username already exists");
        }

        // 3. Process files if provided
        if (req.files) {
            if (req.files.avatar) {
                avatarLocalPath = req.files.avatar[0]?.path;
            }
            if (req.files.coverImage) {
                coverImageLocalPath = req.files.coverImage[0]?.path;
            }
        }

        // 4. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Upload files to Azure Blob Storage if provided
        try {
            if (avatarLocalPath) {
                const avatarUpload = await uploadToAzureBlob(avatarLocalPath);
                avatarUrl = avatarUpload.url;
            }

            if (coverImageLocalPath) {
                const coverImageUpload = await uploadToAzureBlob(coverImageLocalPath);
                coverImageUrl = coverImageUpload.url;
            }
        } catch (uploadError) {
            console.error("File upload failed:", uploadError);
            throw new ApiError(500, "Failed to upload files");
        }

        // 6. Create user
        try {
            createdUser = await User.create({
                id: `user-${Date.now()}`,
                fullName,
                email,
                username: username.toLowerCase(),
                password: hashedPassword,
                type: 'user',
                isAdmin: false
            });

            if (!createdUser) {
                throw new ApiError(500, "Failed to create user");
            }

            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(createdUser.id);

            // Update user with refresh token
            await User.updateRefreshToken(createdUser.id, refreshToken);

            // Create wallet for the new user
            const wallet = await Wallet.create({
                user_id: createdUser.id,
                balance: 0,
                status: "active",
                type: 'wallet'
            });

            // Verify user was created and get full user data
            const verifiedUser = await User.findById(createdUser.id);
            if (!verifiedUser) {
                throw new ApiError(500, "Failed to verify user creation");
            }

            // Remove sensitive information
            const { password: _, refreshToken: __, ...userResponse } = verifiedUser;

            // Create comprehensive response with user, wallet, and token
            const responseData = {
                user: {
                    ...userResponse,
                    wallet: {
                        id: wallet.id,
                        balance: wallet.balance,
                        status: wallet.status
                    }
                },
                accessToken
            };

            // After successful creation, clean up local files only
            if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
                fs.unlinkSync(avatarLocalPath);
            }
            if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
                fs.unlinkSync(coverImageLocalPath);
            }
            filesDeleted = true;

            return res.status(201).json(
                new ApiResponse(201, "User registered successfully", responseData)
            );

        } catch (createError) {
            // If user creation fails, clean up uploaded files
            if (avatarUrl) await deleteFromAzureBlob(avatarUrl);
            if (coverImageUrl) await deleteFromAzureBlob(coverImageUrl);
            throw createError;
        }

    } catch (error) {
        await cleanupFiles();
        
        // If user was partially created, attempt to delete it
        if (createdUser?.id) {
            try {
                await User.delete(createdUser.id);
            } catch (deleteError) {
                console.error("Failed to clean up partially created user:", deleteError);
            }
        }

        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to register user"
        );
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
        console.log('Login attempt for email:', email); // Debug log


    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
        console.log('Found user:', user); // Debug log


    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid); // Debug log


    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await User.updateRefreshToken(user.id, refreshToken);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    const { password: _, refreshToken: __, ...userWithoutSensitiveInfo } = user;

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User logged in successfully", {
                user: userWithoutSensitiveInfo,
                accessToken
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.updateRefreshToken(req.user?.id, "");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"));
});

const getUserDashboard = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Ensure fullName exists or create it from firstName/lastName
        const userInfo = {
            _id: user._id,
            fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            createdAt: user.createdAt,
            username: user.username
        };

        const dashboardData = {
            user: userInfo,
            wallet: null,
            stats: {
                totalAssets: 0,
                totalJobPostings: 0,
                totalApplications: 0,
                totalForumPosts: 0,
                totalReviews: 0
            },
            recentActivity: {
                assets: [],
                jobPostings: [],
                jobApplications: [],
                forumActivity: [],
                reviews: []
            }
        };

        // Get wallet data if exists
        try {
            const wallet = await Wallet.findOne({ user: user._id });
            if (wallet) {
                dashboardData.wallet = {
                    balance: wallet.balance,
                    currency: wallet.currency
                };
            }
        } catch (error) {
            console.error("Wallet fetch error:", error);
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Dashboard data retrieved successfully", dashboardData));

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Failed to fetch dashboard data");
    }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?.id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const accessToken = await User.generateAccessToken(user.id);
        const newRefreshToken = await User.generateRefreshToken(user.id);

        await User.updateRefreshToken(user.id, newRefreshToken);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    "Access token refreshed",
                    { accessToken }
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User fetched successfully", {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                username: user.username,
                createdAt: user.createdAt
            }
        }));
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fullName, email, username } = req.body;
    let avatarLocalPath;
    let coverImageLocalPath;

    try {
        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Verify authorization
        if (req.user.id !== id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to update this profile");
        }

        // Handle file uploads
        if (req.files) {
            if (req.files.avatar) {
                avatarLocalPath = req.files.avatar[0]?.path;
            }
            if (req.files.coverImage) {
                coverImageLocalPath = req.files.coverImage[0]?.path;
            }
        }

        // Upload new files to Azure if provided
        let updateData = {
            fullName,
            email,
            username,
            updated_at: new Date()
        };

        if (avatarLocalPath) {
            const newAvatar = await uploadToAzureBlob(avatarLocalPath);
            if (user.avatar) {
                await deleteFromAzureBlob(user.avatar);
            }
            updateData.avatar = newAvatar;
        }

        if (coverImageLocalPath) {
            const newCoverImage = await uploadToAzureBlob(coverImageLocalPath);
            if (user.coverImage) {
                await deleteFromAzureBlob(user.coverImage);
            }
            updateData.coverImage = newCoverImage;
        }

        // Update user using the new model method
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        // Clean up local files
        if (avatarLocalPath) fs.unlinkSync(avatarLocalPath);
        if (coverImageLocalPath) fs.unlinkSync(coverImageLocalPath);

        return res
            .status(200)
            .json(new ApiResponse(200, "Profile updated successfully", updatedUser));
    } catch (error) {
        // Clean up local files in case of error
        if (avatarLocalPath) fs.unlinkSync(avatarLocalPath);
        if (coverImageLocalPath) fs.unlinkSync(coverImageLocalPath);
        
        throw error;
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Remove sensitive information
        const { password, refreshToken, ...userProfile } = user;

        // Add additional profile information if needed
        const profile = {
            ...userProfile,
            isCurrentUser: req.user?.id === id
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "User profile fetched successfully",
                    { profile }
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to fetch user profile"
        );
    }
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "User ID is required");
    }

    try {
        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Verify authorization (only allow users to delete their own account or admin)
        if (req.user.id !== id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to delete this account");
        }

        // Delete user's files from Azure Blob Storage if they exist
        if (user.avatar) {
            try {
                await deleteFromAzureBlob(user.avatar);
            } catch (error) {
                console.error("Error deleting avatar:", error);
            }
        }
        if (user.coverImage) {
            try {
                await deleteFromAzureBlob(user.coverImage);
            } catch (error) {
                console.error("Error deleting cover image:", error);
            }
        }

        // Delete user's associated data
        try {
            await Promise.all([
                Wallet.findOneAndDelete({ user_id: id }),
                NFTAsset.deleteMany({ creator_id: id }),
                Job.deleteMany({ business_id: id }),
                Job.deleteMany({ developer_id: id }),
                ForumThread.deleteMany({ user_id: id }),
                ForumComment.deleteMany({ user_id: id }),
                JobReview.deleteMany({ reviewer_id: id }),
            ]);
        } catch (error) {
            console.error("Error deleting associated data:", error);
        }

        // Finally, delete the user
        await User.findByIdAndDelete(id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(
                    200,
                    "User account and associated data deleted successfully"
                )
            );

    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to delete user account"
        );
    }
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUserDashboard,
    getCurrentUser,
    updateUserProfile,
    getUserProfile,
    deleteUser
};
