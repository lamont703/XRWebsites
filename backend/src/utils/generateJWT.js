import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const payload = {
    sub: "1234567890",
    name: "John Doe",
    admin: true
};

const secretKey = process.env.ACCESS_TOKEN_SECRET;

const token = jwt.sign(payload, secretKey, {
    algorithm: "HS256",
    expiresIn: process.env.ACCESS_TOKEN_EXPIRATION
});

export default token;