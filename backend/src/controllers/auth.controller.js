import Wallet from "../models/wallet.models.js";
import bcrypt from "bcrypt";

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "Email already registered");
    }

    // Create user
    const user = await User.create({
        id: `user-${Date.now()}`,
        email,
        username,
        password,
        type: 'user'
    });

    // Create wallet for the new user
    const wallet = await Wallet.create({
        user_id: user.id,
        balance: 0,
        status: "active",
        type: 'wallet'
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    const loggedInUser = await User.findById(user.id);

    // Add wallet info to response
    const userResponse = {
        user: loggedInUser,
        wallet: {
            id: wallet.id,
            balance: wallet.balance
        }
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .json(
            new ApiResponse(201, "User registered successfully", userResponse)
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await User.updateRefreshToken(user.id, refreshToken);

    const { password: _, refreshToken: __, ...userResponse } = user;

    return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .json(
            new ApiResponse(200, "User logged in successfully", {
                user: userResponse,
                accessToken
            })
        );
}); 