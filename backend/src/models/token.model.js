import { getContainer } from "../database.js";
import ApiError from "../utils/ApiError.js";

const TokenModel = {
    async create(tokenData) {
        try {
            const container = await getContainer();
            
            const tokenDocument = {
                id: `token-${Date.now()}`,
                type: 'token', // partition key
                mint: tokenData.mint,
                name: tokenData.name,
                symbol: tokenData.symbol,
                decimals: tokenData.decimals,
                totalSupply: tokenData.totalSupply,
                owner: tokenData.owner,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                features: {
                    freezable: tokenData.features?.freezable || false,
                    mintable: tokenData.features?.mintable || false,
                    immutable: tokenData.features?.immutable || false,
                    burnable: tokenData.features?.burnable || false
                },
                metadata: {
                    description: tokenData.metadata?.description || '',
                    website: tokenData.metadata?.website || '',
                    image: tokenData.metadata?.image || ''
                }
            };

            const { resource } = await container.items.create(tokenDocument);
            return resource;
        } catch (error) {
            console.error("Error in create:", error);
            throw error;
        }
    },

    async findOne(query) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'token' AND c.mint = @mint",
                parameters: [{ name: "@mint", value: query.mint }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || null;
        } catch (error) {
            console.error("Error in findOne:", error);
            throw error;
        }
    },

    async find(query) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'token'"
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in find:", error);
            throw error;
        }
    },

    async findByMint(mint) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'token' AND c.mint = @mint",
                parameters: [{ name: "@mint", value: mint }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || null;
        } catch (error) {
            console.error("Error in findByMint:", error);
            throw error;
        }
    },

    async findAll() {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'token'"
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findAll:", error);
            throw error;
        }
    },

    async update(mint, updates) {
        try {
            const container = await getContainer();
            const token = await this.findByMint(mint);
            
            if (!token) {
                throw new ApiError(404, "Token not found");
            }

            const updatedToken = {
                ...token,
                ...updates,
                updated_at: new Date().toISOString()
            };

            const { resource } = await container.items.upsert(updatedToken);
            return resource;
        } catch (error) {
            console.error("Error in update:", error);
            throw error;
        }
    },

    async delete(mint) {
        try {
            const container = await getContainer();
            const token = await this.findByMint(mint);
            
            if (!token) {
                throw new ApiError(404, "Token not found");
            }

            const deletedToken = {
                ...token,
                status: 'deleted',
                updated_at: new Date().toISOString()
            };

            const { resource } = await container.items.upsert(deletedToken);
            return resource;
        } catch (error) {
            console.error("Error in delete:", error);
            throw error;
        }
    }
};

export default TokenModel; 