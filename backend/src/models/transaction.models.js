import { getContainer } from "../db/index.js";

const Transaction = {
    async findByWalletId(walletId, options = {}) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'transaction' AND c.wallet_id = @walletId ORDER BY c.timestamp DESC",
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

    async create(transactionData) {
        try {
            const container = await getContainer();
            if (!transactionData.id) {
                transactionData.id = `transaction-${Date.now()}`;
            }
            
            // Add required fields
            transactionData.type = 'transaction';
            transactionData.timestamp = new Date();
            transactionData.status = transactionData.status || 'completed';

            const { resource } = await container.items.create(transactionData);
            return resource;
        } catch (error) {
            console.error("Error in create:", error);
            throw error;
        }
    },

    async countByWalletId(walletId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'transaction' AND c.wallet_id = @walletId",
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