import asyncHandler from "express-async-handler";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.models.js";
import { uploadToAzureBlob, deleteFromAzureBlob } from "../utils/blobStorage.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import fs from "fs";
import jwt from "jsonwebtoken";

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

export { registerUser, loginUser, logoutUser, getUserDashboard, refreshAccessToken };
