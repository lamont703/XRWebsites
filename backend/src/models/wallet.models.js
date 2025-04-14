import { getContainer } from "../database.js";
import ApiError from "../utils/ApiError.js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export class Wallet {
    constructor(data = {}) {
        this.id = data.id || `wallet-${uuidv4()}`;
        this.type = 'wallet';
        this.address = data.address;
        this.user_id = data.user_id;
        this.balance = data.balance || '0';
        this.network = data.network || process.env.SOLANA_NETWORK || 'devnet';
        this.status = data.status || 'active';
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }

    static async findOne(query) {
        try {
            const container = await getContainer();
            let querySpec;

            if (query.id) {
                querySpec = {
                    query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.id = @id",
                    parameters: [{ name: "@id", value: query.id }]
                };
            } else if (query.user_id) {
                querySpec = {
                    query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.user_id = @userId",
                    parameters: [{ name: "@userId", value: query.user_id }]
                };
            } else if (query.address) {
                querySpec = {
                    query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.address = @address",
                    parameters: [{ name: "@address", value: query.address }]
                };
            }

            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || null;
        } catch (error) {
            throw new ApiError(500, "Error finding wallet");
        }
    }

    static async create(walletData) {
        try {
            const container = await getContainer();
            const wallet = new Wallet(walletData);
            
            const { resource } = await container.items.create(wallet);
            return resource;
        } catch (error) {
            throw new ApiError(500, "Error creating wallet");
        }
    }

    static async updateOne(query, updateData) {
        try {
            const container = await getContainer();
            const wallet = await this.findOne(query);
            
            if (!wallet) {
                return null;
            }

            const updatedWallet = {
                ...wallet,
                ...updateData,
                updated_at: new Date().toISOString()
            };

            const { resource } = await container.item(wallet.id, 'wallet').replace(updatedWallet);
            return resource;
        } catch (error) {
            throw new ApiError(500, "Error updating wallet");
        }
    }

    static async updateBalance(walletId, amount) {
        try {
            const container = await getContainer();
            const wallet = await this.findOne({ id: walletId });

            if (!wallet) {
                throw new ApiError(404, "Wallet not found");
            }

            const newBalance = (parseFloat(wallet.balance) || 0) + parseFloat(amount);
            
            const { resource } = await container.item(walletId, 'wallet').patch([
                {
                    op: "set",
                    path: "/balance",
                    value: newBalance.toString()
                },
                {
                    op: "set",
                    path: "/updated_at",
                    value: new Date().toISOString()
                }
            ]);

            return resource;
        } catch (error) {
            throw new ApiError(500, "Error updating wallet balance");
        }
    }

    static async recordTransaction(walletId, type, amount, details) {
        try {
            const container = await getContainer();
            const transaction = {
                id: `txn-${uuidv4()}`,
                type: 'transaction',
                wallet_id: walletId,
                transaction_type: type,
                amount,
                status: "completed",
                created_at: new Date().toISOString(),
                details
            };

            const { resource } = await container.items.create(transaction);
            return resource;
        } catch (error) {
            throw new ApiError(500, "Error recording transaction");
        }
    }
}

export default Wallet;