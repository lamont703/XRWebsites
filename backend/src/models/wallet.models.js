import { getContainer } from "../database.js";
import ApiError from "../utils/ApiError.js";
import dotenv from "dotenv";

dotenv.config();

const Wallet = {
    async findOne(query) {
        try {
            const container = await getContainer();
            let querySpec;

            if (query.id) {
                querySpec = {
                    query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.id = @id",
                    parameters: [
                        {
                            name: "@id",
                            value: query.id
                        }
                    ]
                };
            } else if (query.user_id) {
                querySpec = {
                    query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.user_id = @userId",
                    parameters: [
                        {
                            name: "@userId",
                            value: query.user_id
                        }
                    ]
                };
            }
            
            const { resources } = await container.items
                .query(querySpec, {
                    partitionKey: 'wallet'  // Using 'wallet' as partition key
                })
                .fetchAll();
                
            return resources[0] || null;
        } catch (error) {
            throw new ApiError(500, "Error finding wallet", error.message);
        }
    },

    async findById(id) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.id = @id",
                parameters: [{ name: "@id", value: id }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || null;
        } catch (error) {
            console.error("Error in findById:", error);
            throw error;
        }
    },

    async create(walletData) {
        try {
            const container = await getContainer();
            if (!walletData.id) {
                walletData.id = `wallet-${Date.now()}`;
            }
            
            // Add required fields
            walletData.type = 'wallet';
            walletData.created_at = new Date().toISOString();
            walletData.updated_at = new Date().toISOString();
            walletData.balance = walletData.balance || 0;
            
            const { resource } = await container.items.create({
                ...walletData,
                type: 'wallet',
                created_at: new Date().toISOString()
            });
            return resource;
        } catch (error) {
            throw new ApiError(500, "Error creating wallet", error.message);
        }
    },

    async updateOne(query, update) {
        try {
            const container = await getContainer();
            const wallet = await this.findOne(query);
            if (!wallet) return null;

            const updatedWallet = { 
                ...wallet, 
                ...update,
                updated_at: new Date().toISOString()
            };

            const { resource } = await container.items.upsert(updatedWallet);
            return resource;
        } catch (error) {
            console.error("Error in updateOne:", error);
            throw error;
        }
    },

    async findOneAndUpdate(query, update, options = {}) {
        try {
            const container = await getContainer();
            const wallet = await this.findOne(query);
            
            if (!wallet) {
                console.error('❌ Wallet not found for update:', query);
                return null;
            }

            // Handle $inc operator for balance
            if (update.$inc?.balance) {
                wallet.balance = (parseFloat(wallet.balance) || 0) + parseFloat(update.$inc.balance);
            }

            // Handle $set operator
            if (update.$set) {
                Object.assign(wallet, update.$set);
            }

            const { resource } = await container.items.upsert(wallet);
            console.log('✅ Wallet updated successfully:', resource);
            return resource;
        } catch (error) {
            console.error('❌ findOneAndUpdate error:', error);
            throw error;
        }
    },

    async updateBalance(walletId, amount) {
        console.log('🔍 Attempting to update wallet:', { walletId, amount });
        try {
            const updatedWallet = await this.findOneAndUpdate(
                { id: walletId },
                { 
                    $inc: { balance: parseFloat(amount) },
                    $set: { updated_at: new Date().toISOString() }
                }
            );

            if (!updatedWallet) {
                console.error('❌ Wallet not found:', walletId);
                throw new Error('Wallet not found');
            }

            console.log('✅ Wallet updated:', updatedWallet);
            return updatedWallet;
        } catch (error) {
            console.error('❌ Update balance error:', error);
            throw error;
        }
    },

    async recordTransaction(walletId, type, amount, details) {
        try {
            const container = await getContainer();
            const transaction = {
                id: `txn-${Date.now()}`,
                type: 'transaction',
                wallet_id: walletId,
                transaction_type: type,
                amount,
                status: "completed",
                timestamp: new Date().toISOString(),
                details
            };

            const { resource } = await container.items.create(transaction);
            return resource;
        } catch (error) {
            console.error("Error in recordTransaction:", error);
            throw error;
        }
    },

    async update(id, updateData) {
        try {
            const container = await getContainer();
            const { resource } = await container.item(id, 'wallet').replace({
                ...updateData,
                type: 'wallet',
                updated_at: new Date().toISOString()
            });
            return resource;
        } catch (error) {
            throw new ApiError(500, "Error updating wallet", error.message);
        }
    }
};

export default Wallet;