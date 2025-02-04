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
import JobApplication from "../models/jobApplication.models.js";
import ForumPost from "../models/forumPost.models.js";
import Review from "../models/review.models.js";
//import getContainer from "../database.js";

// Generate access and refresh tokens for user authentication.
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

// Register a new user.
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

// Login a user.
const loginUser = asyncHandler(async (req, res) => {

    // Get the email and password from the request body. 
    const { email, password } = req.body;
        console.log('Login attempt for email:', email); // Debug log


    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find the user by email.
    const user = await User.findOne({ email });
        console.log('Found user:', user); // Debug log


    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Check if the password is valid using bcrypt. 
    const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid); // Debug log


    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate access and refresh tokens for the user.
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Update the user's refresh token in the database.
    await User.updateRefreshToken(user.id, refreshToken);

    // Set the options for the cookies.
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    // Remove sensitive information from the user object.
    const { password: _, refreshToken: __, ...userWithoutSensitiveInfo } = user;

    // Return the response with the user, access token, and refresh token.
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

// Logout a user.
const logoutUser = asyncHandler(async (req, res) => {
    // Update the user's refresh token in the database to an empty string.
    await User.updateRefreshToken(req.user?.id, "");

    // Set the options for the cookies.
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    // Return the response with a message indicating the user has been logged out.
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"));
});

// Get user dashboard.
const getUserDashboard = asyncHandler(async (req, res) => {
    try {
        // Get user from database using Cosmos DB compatible queries 
        const user = await User.findById(req.user.id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Get user information from database 
        const userInfo = {
            _id: user._id,
            fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            createdAt: user.createdAt,
            username: user.username
        };

        // Get recent activities using Cosmos DB compatible queries
        const [assetsResult, jobs, applications, forumPosts, reviews] = await Promise.all([
            // Get recent NFT assets with count
            NFTAsset.find({ owner: user._id }, { limit: 5 }),

            // Get recent job postings
            Job.findAll({ 
                userId: user._id,
                status: 'active'
            }, { limit: 5 }),

            // Get recent job applications
            JobApplication.find({ applicantId: user._id }),

            // Get recent forum activity
            ForumPost.find({ userId: user._id }),

            // Get recent reviews
            Review.find({ userId: user._id })
        ]);

        // Get all jobs for count
        const allJobs = await Job.findAll({ userId: user._id });

        const dashboardData = {
            user: userInfo,
            wallet: null,
            stats: {
                totalAssets: assetsResult.pagination.total,
                totalJobPostings: allJobs.length,
                totalApplications: applications.length,
                totalForumPosts: forumPosts.length,
                totalReviews: reviews.length
            },
            recentActivity: {
                assets: assetsResult.nfts || [],
                jobPostings: jobs || [],
                jobApplications: applications || [],
                forumActivity: forumPosts || [],
                reviews: reviews || []
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

// Refresh access token.
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

// Get current user.
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
                phone: user.phone,
                bio: user.bio,
                location: user.location,
                website: user.website,
                createdAt: user.createdAt
            }
        }));
});

// Update user profile.
const updateUserProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fullName, email, username, phone, bio, location, website } = req.body;

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

        // Check if email is being changed and if it's already in use
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new ApiError(400, "Email already in use");
            }
        }

        let updateData = {
            fullName,
            email,
            username,
            phone,
            bio,
            location,
            website,
            updated_at: new Date()
        };

        // Update user using the new model method
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        // If email was changed, force logout on next request
        if (email && email !== user.email) {
            // Invalidate all existing tokens
            await User.updateRefreshToken(id, null);
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Profile updated successfully", updatedUser));
    } catch (error) {
        throw error;
    }
});

// Get user profile.
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

// Delete user.
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
                ForumPost.deleteMany({ user_id: id }),
                Review.deleteMany({ userId: id }),
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
