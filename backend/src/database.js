import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";

// Load environment variables from .env file for local development.
dotenv.config();

// Connect to the database and create a container if it doesn't exist.
const connectDB = async () => {
    try {
        const client = new CosmosClient({
            endpoint: process.env.COSMOS_DB_ENDPOINT,
            key: process.env.COSMOS_DB_KEY,
        });

        const { database } = await client.databases.createIfNotExists({
            id: process.env.COSMOS_DB_DATABASE
        });

        // Define container configuration
        const containerConfig = {
            id: process.env.COSMOS_DB_CONTAINER,
            partitionKey: { paths: ["/type"] },
            indexingPolicy: {
                indexingMode: "consistent",
                automatic: true,
                includedPaths: [
                    {
                        path: "/*"
                    }
                ],
                compositeIndexes: [
                    [
                        { path: "/type", order: "ascending" },
                        { path: "/created_at", order: "descending" }
                    ],
                    [
                        { path: "/type", order: "ascending" },
                        { path: "/status", order: "ascending" }
                    ]
                ]
            }
        };

        // Create container if it doesn't exist
        const { container } = await database.containers.createIfNotExists(containerConfig);
        
        console.log(`Connected to ${process.env.COSMOS_DB_DATABASE} and ${containerConfig.id}`);
        return client;
    } catch (error) {
        console.error("Database connection error details:", {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        process.exit(1);
    }
};

// Export the container for use in models and other modules.
export const getContainer = async () => {
    const client = new CosmosClient({
        endpoint: process.env.COSMOS_DB_ENDPOINT,
        key: process.env.COSMOS_DB_KEY,
    });
    
    const database = client.database(process.env.COSMOS_DB_DATABASE);
    return database.container(process.env.COSMOS_DB_CONTAINER);
};

export default connectDB;