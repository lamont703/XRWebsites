import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

dotenv.config();

//cosmos db client
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
});

//get database and container
const container = cosmosClient.database(process.env.COSMOS_DB_NAME).container("Users");

//create model
const User = {
    async findOne(query) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.email = @email OR c.username = @username",
                parameters: [
                    {
                        name: "@email",
                        value: query.email
                    },
                    {
                        name: "@username",
                        value: query.username
                    }
                ]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || null;
        } catch (error) {
            console.error("Error in findOne:", error);
            throw error;
        }
    },

    async create(userData) {
        try {
            // Add id field if not present
            if (!userData.id) {
                userData.id = `user-${Date.now()}`;
            }
            const { resource } = await container.items.create(userData);
            return resource;
        } catch (error) {
            console.error("Error in create:", error);
            throw error;
        }
    },

    async findById(id) {
        try {
            // Query by id instead of using direct item access
            const querySpec = {
                query: "SELECT * FROM c WHERE c.id = @id",
                parameters: [{ name: "@id", value: id }]
            };
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || null;
        } catch (error) {
            console.error("Error in findById:", error);
            throw error;
        }
    },

    async generateAccessToken(userId) {
        try {
            return jwt.sign(
                { id: userId },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
            );
        } catch (error) {
            throw new ApiError(500, "Error generating access token");
        }
    },

    async generateRefreshToken(userId) {
        try {
            return jwt.sign(
                { id: userId },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
            );
        } catch (error) {
            throw new ApiError(500, "Error generating refresh token");
        }
    },

    async updateRefreshToken(userId, refreshToken) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.id = @id",
                parameters: [{ name: "@id", value: userId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const user = resources[0];
            
            if (!user) return null;

            user.refreshToken = refreshToken;
            const { resource } = await container.items.upsert(user);
            return resource;
        } catch (error) {
            throw new ApiError(500, "Error updating refresh token");
        }
    },

    async findByIdAndUpdate(id, update, options = {}) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.id = @id",
                parameters: [{ name: "@id", value: id }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const user = resources[0];
            
            if (!user) return null;

            // Apply updates
            const updatedUser = { ...user, ...update.$set };
            
            // Update the document
            const { resource } = await container.items.upsert(updatedUser);
            return options.new ? resource : user;
        } catch (error) {
            console.error("Error in findByIdAndUpdate:", error);
            throw error;
        }
    },

    async findByIdAndDelete(id) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.id = @id",
                parameters: [{ name: "@id", value: id }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const user = resources[0];
            
            if (!user) return null;

            // Delete the user document
            await container.item(id, id).delete();
            return user;
        } catch (error) {
            console.error("Error in findByIdAndDelete:", error);
            throw error;
        }
    }
};

//export model
export default User;

