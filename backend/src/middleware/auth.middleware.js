import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import { getContainer } from '../database.js';

export const verifyJWT = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        console.log('🔒 Full Authorization header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No valid Authorization header');
            throw new ApiError(401, "No token provided");
        }

        const token = authHeader.split(' ')[1];
        console.log('🔑 Extracted token:', token ? `${token.substring(0, 15)}...` : 'No token');
        console.log('🔐 JWT Secret available:', !!process.env.JWT_SECRET);
        
        try {
            console.log('🔄 Attempting to verify token...');
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token verified successfully for user:', decodedToken.id);
            
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

            req.user = {
                ...decodedToken,
                name: userData.fullName,
                username: userData.username,
                avatar: userData.avatar
            };

            next();
        } catch (error) {
            console.error('🚫 Token verification failed:', error);
            if (error.name === 'TokenExpiredError') {
                throw new ApiError(401, "Token has expired");
            }
            throw new ApiError(401, "Invalid access token");
        }
    } catch (error) {
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