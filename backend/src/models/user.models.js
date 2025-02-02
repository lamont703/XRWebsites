import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { getContainer } from "../db/index.js";

dotenv.config();

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
});

const database = cosmosClient.database(process.env.COSMOS_DB_NAME);
const container = database.container(process.env.COSMOS_DB_CONTAINER);

//create model
const User = {
    async findOne(query) {
        try {
            console.log('Finding user with query:', query); // Debug log
            
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'user' AND c.email = @email",
                parameters: [
                    {
                        name: "@email",
                        value: query.email
                    }
                ]
            };
            
            const container = await getContainer();
            const { resources } = await container.items.query(querySpec).fetchAll();
            console.log('Found user:', resources[0]); // Debug log

            return resources[0] || null;
        } catch (error) {
            console.error("Error in findOne:", error);
            throw error;
        }
    },

    async create(userData) {
        try {
            if (!userData.id) {
                userData.id = `user-${Date.now()}`;
            }
            
            // Add required fields
            userData.type = 'user'; // Important: Add document type
            userData.created_at = new Date();
            userData.updated_at = new Date();
            userData.isAdmin = userData.isAdmin || false;
            userData.adminRole = userData.adminRole || null;
            
            // First check if user exists to prevent duplicates
            const existingUser = await this.findOne({
                email: userData.email,
                username: userData.username
            });

            if (existingUser) {
                throw new ApiError(409, "User already exists");
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
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
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
                query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
                parameters: [{ name: "@id", value: userId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const user = resources[0];
            
            if (!user) return null;

            user.refreshToken = refreshToken;
            user.updated_at = new Date();
            
            const { resource } = await container.items.upsert(user);
            return resource;
        } catch (error) {
            console.error("Error in updateRefreshToken:", error);
            throw new ApiError(500, "Error updating refresh token");
        }
    },

    async findByIdAndUpdate(id, update, options = {}) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
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
                query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
                parameters: [{ name: "@id", value: id }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const user = resources[0];
            
            if (!user) return null;

            // Delete the user document
            await container.item(id, user.type).delete();
            return user;
        } catch (error) {
            console.error("Error in findByIdAndDelete:", error);
            throw error;
        }
    },

    // Add method to promote user to admin
    async promoteToAdmin(userId, adminRole = 'admin') {
        try {
            const user = await this.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.isAdmin = true;
            user.adminRole = adminRole;
            user.updatedAt = new Date();

            const { resource } = await container.items.upsert(user);
            return resource;
        } catch (error) {
            console.error("Error in promoteToAdmin:", error);
            throw error;
        }
    },

    // Add this method after the existing methods in User object
    async find() {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'user'"
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in find:", error);
            throw error;
        }
    },

    // Add this method to the User object
    async countDocuments() {
        try {
            const querySpec = {
                query: "SELECT VALUE COUNT(1) FROM c"
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || 0;
        } catch (error) {
            console.error("Error in countDocuments:", error);
            throw error;
        }
    },

    async update(id, updateData) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
                parameters: [{ name: "@id", value: id }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const user = resources[0];
            
            if (!user) return null;

            // Apply updates
            const updatedUser = { ...user, ...updateData.$set };
            
            // Update the document
            const { resource } = await container.items.upsert(updatedUser);
            return resource;
        } catch (error) {
            console.error("Error in update:", error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const user = await this.findById(id);
            
            if (!user) {
                return null;
            }

            await container.item(id, user.type).delete();
            return true;
        } catch (error) {
            console.error("Error in delete:", error);
            throw error;
        }
    }
};

//export model
export default User;

