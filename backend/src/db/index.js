import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        const client = new CosmosClient({
            endpoint: process.env.COSMOS_DB_ENDPOINT,
            key: process.env.COSMOS_DB_KEY,
        });

        const { database } = await client.databases.createIfNotExists({
            id: process.env.COSMOS_DB_NAME
        });

        // Define container configuration
        const containerConfig = {
            id: "XRWContainer",
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
        
        console.log(`Connected to ${process.env.COSMOS_DB_NAME} database and XRWContainer`);
        return client;
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

// Export the container for use in models
export const getContainer = async () => {
    const client = new CosmosClient({
        endpoint: process.env.COSMOS_DB_ENDPOINT,
        key: process.env.COSMOS_DB_KEY,
    });
    
    const database = client.database(process.env.COSMOS_DB_NAME);
    return database.container("XRWContainer");
};

export default connectDB;