import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";
import ApiError from "../utils/ApiError.js";

dotenv.config();

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
});

const container = cosmosClient.database(process.env.COSMOS_DB_NAME).container("Wallets");

const Wallet = {
    async findOne(query) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.user_id = @userId",
                parameters: [
                    {
                        name: "@userId",
                        value: query.user_id
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

    async create(walletData) {
        try {
            if (!walletData.id) {
                walletData.id = `wallet-${Date.now()}`;
            }
            const { resource } = await container.items.create(walletData);
            return resource;
        } catch (error) {
            console.error("Error in create:", error);
            throw error;
        }
    },

    async findById(id) {
        try {
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

    async updateOne(query, update) {
        try {
            const wallet = await this.findOne(query);
            if (!wallet) return null;

            const updatedWallet = { ...wallet, ...update };
            const { resource } = await container.items.upsert(updatedWallet);
            return resource;
        } catch (error) {
            console.error("Error in updateOne:", error);
            throw error;
        }
    },

    async updateBalance(id, amount) {
        try {
            const wallet = await this.findById(id);
            if (!wallet) return null;

            const newBalance = wallet.balance + amount;
            if (newBalance < 0) {
                throw new ApiError(400, "Insufficient funds");
            }

            const updatedWallet = {
                ...wallet,
                balance: newBalance,
                updated_at: new Date()
            };

            const { resource } = await container.items.upsert(updatedWallet);
            return resource;
        } catch (error) {
            console.error("Error in updateBalance:", error);
            throw error;
        }
    },

    async recordTransaction(walletId, type, amount, details) {
        try {
            const transaction = {
                id: `txn-${Date.now()}`,
                wallet_id: walletId,
                type,
                amount,
                status: "completed",
                timestamp: new Date(),
                details
            };

            const transactionContainer = cosmosClient
                .database(process.env.COSMOS_DB_NAME)
                .container("Transactions");

            const { resource } = await transactionContainer.items.create(transaction);
            return resource;
        } catch (error) {
            console.error("Error in recordTransaction:", error);
            throw error;
        }
    }
};

export default Wallet;