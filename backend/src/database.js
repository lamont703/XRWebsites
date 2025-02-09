import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";

// Load environment variables from .env file for local development.
dotenv.config();

let client = null;
let container = null;

// Connect to the database and create a container if it doesn't exist.
export const connectDB = async () => {
    try {
        // Log connection attempt
        console.log('Attempting to connect to Cosmos DB:', {
            endpoint: process.env.COSMOS_DB_ENDPOINT ? 'Set' : 'Missing',
            database: process.env.COSMOS_DB_DATABASE,
            container: process.env.COSMOS_DB_CONTAINER
        });

        // Initialize client with timeout
        client = new CosmosClient({
            endpoint: process.env.COSMOS_DB_ENDPOINT,
            key: process.env.COSMOS_DB_KEY,
            connectionPolicy: {
                requestTimeout: 30000, // 30 seconds
                enableEndpointDiscovery: false
            }
        });

        // Test connection first
        await client.databases.readAll().fetchAll();

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
        const { container: newContainer } = await database.containers.createIfNotExists(containerConfig);
        container = newContainer;
        
        console.log('✅ Connected to Cosmos DB:', {
            database: process.env.COSMOS_DB_DATABASE,
            container: containerConfig.id
        });
        return client;
    } catch (error) {
        console.error("❌ Database connection error:", {
            message: error.message,
            code: error.code,
            name: error.name,
            statusCode: error?.statusCode,
            requestCharge: error?.requestCharge
        });
        throw error; // Let the caller handle the error
    }
};

// Use cached container instance if available
export const getContainer = async () => {
    if (!container) {
        if (!client) {
            await connectDB();
        }
        const database = client.database(process.env.COSMOS_DB_DATABASE);
        container = database.container(process.env.COSMOS_DB_CONTAINER);
    }
    return container;
};

