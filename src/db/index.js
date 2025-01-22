import { CosmosClient } from "@azure/cosmos";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        const client = await new CosmosClient({
            endpoint: process.env.COSMOS_DB_ENDPOINT,
            key: process.env.COSMOS_DB_KEY,
            message: console.log(`Connected to XRWDatabase at ${process.env.COSMOS_DB_ENDPOINT}`) 
        });
        return client;
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};


export default connectDB;