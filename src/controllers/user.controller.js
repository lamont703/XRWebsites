import asyncHandler from "express-async-handler";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.models.js";
import { uploadToAzureBlob, deleteFromAzureBlob } from "../utils/blobStorage.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import fs from "fs";
import jwt from "jsonwebtoken";
import Wallet from "../models/wallet.models.js";
import Asset from "../models/asset.models.js";
import JobPosting from "../models/jobPosting.models.js";
import JobApplication from "../models/jobApplication.models.js";
import ForumThread from "../models/forumThread.models.js";
import ForumComment from "../models/forumComment.models.js";
import AssetReview from "../models/assetReview.models.js";
import JobReview from "../models/jobReview.models.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, username } = req.body;
    let avatarLocalPath;
    let coverImageLocalPath;

    try {
        // Validation
        if ([fullName, email, password, username].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        const existedUser = await User.findOne({
            email,
            username,
        });

        if (existedUser) {
            throw new ApiError(409, "User with this email or username already exists");
        }

        // Check if files exist in the request
        if (!req.files || !req.files.avatar) {
            throw new ApiError(400, "Avatar file is required");
        }

        avatarLocalPath = req.files.avatar[0]?.path;
        
        if (req.files.coverImage) {
            coverImageLocalPath = req.files.coverImage[0]?.path;
        }

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required");
        }

        // Hash the password first (this is less likely to fail)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Upload files to Azure Blob Storage
        const avatar = await uploadToAzureBlob(avatarLocalPath);
        let coverImage;
        
        if (coverImageLocalPath) {
            coverImage = await uploadToAzureBlob(coverImageLocalPath);
        }

        // Create user in database
        const user = await User.create({
            id: `user-${Date.now()}`,
            fullName,
            avatar: avatar.url || "",
            coverImage: coverImage?.url || "",
            email,
            username: username.toLowerCase(),
            password: hashedPassword,
        });

        const createdUser = await User.findById(user.id);

        if (!createdUser) {
            // If user creation fails, delete uploaded files
            if (avatar) {
                await deleteFromAzureBlob(avatar.url);
            }
            if (coverImage) {
                await deleteFromAzureBlob(coverImage.url);
            }
            throw new ApiError(500, "Failed to create user");
        }

        const { password: _, refreshToken: __, ...userResponse } = createdUser;

        return res.status(201).json(
            new ApiResponse(201, "User created successfully", userResponse)
        );

    } catch (error) {
        // Clean up local files
        if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
            fs.unlinkSync(avatarLocalPath);
        }
        if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
            fs.unlinkSync(coverImageLocalPath);
        }

        // Re-throw the error with appropriate message
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to create user"
        );
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = await User.generateAccessToken(user.id);
    const refreshToken = await User.generateRefreshToken(user.id);

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
    const user = await User.findById(req.user.id);
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Remove sensitive information
    const { password, refreshToken, ...userInfo } = user;

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "User dashboard fetched successfully",
                { user: userInfo }
            )
        );
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
    try {
        const user = await User.findById(req.user?.id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Remove sensitive information
        const { password, refreshToken, ...userInfo } = user;

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "User profile fetched successfully",
                    { user: userInfo }
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to fetch user profile"
        );
    }
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

        // Verify authorization (only allow users to update their own profile or admin)
        if (req.user.id !== id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to update this profile");
        }

        // Handle file uploads if present
        if (req.files) {
            if (req.files.avatar) {
                avatarLocalPath = req.files.avatar[0]?.path;
            }
            if (req.files.coverImage) {
                coverImageLocalPath = req.files.coverImage[0]?.path;
            }
        }

        // Upload new files to Azure if provided
        let newAvatar, newCoverImage;
        if (avatarLocalPath) {
            newAvatar = await uploadToAzureBlob(avatarLocalPath);
            // Delete old avatar if exists
            if (user.avatar) {
                await deleteFromAzureBlob(user.avatar);
            }
        }
        if (coverImageLocalPath) {
            newCoverImage = await uploadToAzureBlob(coverImageLocalPath);
            // Delete old cover image if exists
            if (user.coverImage) {
                await deleteFromAzureBlob(user.coverImage);
            }
        }

        // Update user data
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                $set: {
                    fullName: fullName || user.fullName,
                    email: email || user.email,
                    username: username ? username.toLowerCase() : user.username,
                    avatar: newAvatar?.url || user.avatar,
                    coverImage: newCoverImage?.url || user.coverImage,
                    updated_at: new Date()
                }
            },
            { new: true }
        );

        // Remove sensitive information
        const { password: _, refreshToken: __, ...userResponse } = updatedUser;

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "User profile updated successfully",
                    userResponse
                )
            );

    } catch (error) {
        // Clean up local files if they exist
        if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
            fs.unlinkSync(avatarLocalPath);
        }
        if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
            fs.unlinkSync(coverImageLocalPath);
        }

        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to update user profile"
        );
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
                Asset.deleteMany({ creator_id: id }),
                JobPosting.deleteMany({ business_id: id }),
                JobApplication.deleteMany({ developer_id: id }),
                ForumThread.deleteMany({ user_id: id }),
                ForumComment.deleteMany({ user_id: id }),
                AssetReview.deleteMany({ user_id: id }),
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
