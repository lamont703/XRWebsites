import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";

dotenv.config();

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
});

const container = cosmosClient.database(process.env.COSMOS_DB_NAME).container("Transactions");

const Transaction = {
    async findByWalletId(walletId, options = {}) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.wallet_id = @walletId ORDER BY c.timestamp DESC",
                parameters: [
                    {
                        name: "@walletId",
                        value: walletId
                    }
                ]
            };

            // Add pagination if specified
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;
            
            if (limit) {
                querySpec.query += ` OFFSET ${offset} LIMIT ${limit}`;
            }
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findByWalletId:", error);
            throw error;
        }
    },

    async countByWalletId(walletId) {
        try {
            const querySpec = {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.wallet_id = @walletId",
                parameters: [
                    {
                        name: "@walletId",
                        value: walletId
                    }
                ]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || 0;
        } catch (error) {
            console.error("Error in countByWalletId:", error);
            throw error;
        }
    }
};

export default Transaction;