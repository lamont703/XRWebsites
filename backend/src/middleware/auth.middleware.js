import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import { getContainer } from '../database.js';

export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get full user data from database
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
                parameters: [{ name: '@id', value: decodedToken.id }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const userData = resources[0];

            if (!userData) {
                throw new ApiError(404, "User not found");
            }

            // Combine token data with database user data
            req.user = {
                ...decodedToken,
                name: userData.fullName,
                username: userData.username,
                avatar: userData.avatar
            };

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new ApiError(401, "Token has expired");
            }
            throw new ApiError(401, "Invalid access token");
        }
    } catch (error) {
        // Pass the error to the error handling middleware
        next(error);
    }
};

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, "No token provided");
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            throw new ApiError(401, "No token provided");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        next(new ApiError(401, "Invalid token"));
    }
}; 