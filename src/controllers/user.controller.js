import asyncHandler from "express-async-handler";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.models.js";
import { uploadToAzureBlob, deleteFromAzureBlob } from "../utils/blobStorage.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import fs from "fs";

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

export { registerUser };
