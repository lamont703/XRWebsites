import { CosmosClient } from "@azure/cosmos";
//import { Schema } from "mongoose";
//import bcrypt from "bcryptjs";
//import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

//cosmos db client
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
});

//get database and container
const container = cosmosClient.database(process.env.COSMOS_DB_NAME).container("Users");

/*create schema
const userSchema = new Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true, 
        trim: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true, 
        trim: true 
    },
    password_hash: { 
        type: String, 
        required: [true, "Password is required"], 
    },
    role: { 
        type: String, 
        required: [true, "Role is required"], 
        default: "User", 
        trim: true 
    },
    created_at: { 
        type: Date, 
        default: new Date() 
    },
    updated_at: { 
        type: Date, 
        default: new Date() 
    },
});

//pre save hook
userSchema.pre("save", async function (next){

    if(!this.modified('password')) return next();
    this.password = bcrypt.hash(this.password, 10);
    
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    //short lived access token
    return jwt.sign({
        id: this.id,
        username: this.username,
        email: this.email,
        role: this.role
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION });
}

userSchema.methods.generateRefreshToken = function(){
    //long lived refresh token
    return jwt.sign({
        id: this.id,
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION });
}*/

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
    }
};

//export model
export default User;

