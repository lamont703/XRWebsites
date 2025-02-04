import { getContainer } from "../database.js";
import ApiError from "../utils/ApiError.js";
import Wallet from "./wallet.models.js";

const NFTAsset = {
    async find(query = {}, options = {}) {
        try {
            const container = await getContainer();
            const { page = 1, limit = 10 } = options;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            let queryString = "SELECT * FROM c WHERE c.type = 'nft'";
            const parameters = [];

            // Build query conditions
            if (query.category) {
                queryString += " AND c.category = @category";
                parameters.push({ name: "@category", value: query.category });
            }
            if (query.creator_id) {
                queryString += " AND c.creator_id = @creatorId";
                parameters.push({ name: "@creatorId", value: query.creator_id });
            }
            if (query.owner_wallet_id) {
                queryString += " AND c.owner_wallet_id = @walletId";
                parameters.push({ name: "@walletId", value: query.owner_wallet_id });
            }
            if (query.price_range) {
                const [min, max] = query.price_range;
                if (min !== null) {
                    queryString += " AND c.price >= @minPrice";
                    parameters.push({ name: "@minPrice", value: min });
                }
                if (max !== null) {
                    queryString += " AND c.price <= @maxPrice";
                    parameters.push({ name: "@maxPrice", value: max });
                }
            }

            // Add pagination
            queryString += " ORDER BY c.created_at DESC OFFSET @offset LIMIT @limit";
            parameters.push(
                { name: "@offset", value: offset },
                { name: "@limit", value: parseInt(limit) }
            );

            const querySpec = { query: queryString, parameters };
            const { resources } = await container.items.query(querySpec).fetchAll();

            // Get total count for pagination
            const countQuery = queryString.replace("SELECT *", "SELECT VALUE COUNT(1)");
            const { resources: [totalCount] } = await container.items.query({ 
                query: countQuery, 
                parameters 
            }).fetchAll();

            return {
                nfts: resources,
                pagination: {
                    total: totalCount || 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil((totalCount || 0) / limit)
                }
            };
        } catch (error) {
            console.error("Error in find:", error);
            throw error;
        }
    },

    async create(nftData) {
        try {
            const container = await getContainer();
            
            // Set required fields with type for partition key
            const nftDocument = {
                id: `nft-${Date.now()}`,
                type: 'nft', // This is our partition key
                name: nftData.name,
                description: nftData.description,
                image_url: nftData.image_url,
                owner_wallet_id: nftData.owner_wallet_id,
                creator_id: nftData.creator_id,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                transfer_history: [{
                    from: null,
                    to: nftData.owner_wallet_id,
                    timestamp: new Date().toISOString(),
                    transaction_type: "mint"
                }],
                metadata: {
                    name: nftData.name,
                    description: nftData.description,
                    imageUrl: nftData.image_url,
                    attributes: nftData.metadata?.attributes || [],
                    royalties: nftData.metadata?.royalties || 0,
                    supply: nftData.metadata?.supply || 1,
                    value: nftData.value || 0
                }
            };

            // Ensure wallet connection
            if (!nftDocument.owner_wallet_id) {
                throw new ApiError(400, "owner_wallet_id is required");
            }

            // Create with partition key
            const { resource } = await container.items.create(nftDocument);
            return resource;
        } catch (error) {
            console.error("Error in create:", error);
            throw error;
        }
    },

    async findById(id) {
        try {
            const container = await getContainer();
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

    async findByWalletId(walletId, options = {}) {
        try {
            const container = await getContainer();
            const { page = 1, limit = 10 } = options;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            const countQuerySpec = {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'nft' AND c.owner_wallet_id = @walletId",
                parameters: [{ name: "@walletId", value: walletId }]
            };
            
            const { resources: [totalCount] } = await container.items.query(countQuerySpec).fetchAll();

            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'nft' AND c.owner_wallet_id = @walletId ORDER BY c.created_at DESC OFFSET @offset LIMIT @limit",
                parameters: [
                    { name: "@walletId", value: walletId },
                    { name: "@offset", value: offset },
                    { name: "@limit", value: parseInt(limit) }
                ]
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            
            return {
                nfts: resources,
                pagination: {
                    total: totalCount || 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil((totalCount || 0) / limit)
                }
            };
        } catch (error) {
            console.error("Error in findByWalletId:", error);
            throw error;
        }
    },

    async transferNFT(nftId, fromWalletId, toWalletId, userId, isAdmin) {
        try {
            const container = await getContainer();
            
            // Find the NFT
            const nft = await this.findById(nftId);
            if (!nft) {
                throw new ApiError(404, "NFT not found");
            }

            // Verify ownership
            if (nft.owner_wallet_id !== fromWalletId) {
                throw new ApiError(400, "NFT is not owned by the source wallet");
            }

            // Check authorization (allow admin or owner)
            const wallet = await Wallet.findById(fromWalletId);
            if (!wallet) {
                throw new ApiError(404, "Source wallet not found");
            }

            if (!isAdmin && wallet.user_id !== userId) {
                throw new ApiError(403, "Not authorized to transfer this NFT");
            }

            // Update NFT ownership
            const updatedNFT = {
                ...nft,
                owner_wallet_id: toWalletId,
                updated_at: new Date(),
                transfer_history: [
                    ...nft.transfer_history,
                    {
                        from: fromWalletId,
                        to: toWalletId,
                        timestamp: new Date(),
                        transaction_type: "transfer"
                    }
                ]
            };

            const { resource } = await container.items.upsert(updatedNFT);
            return resource;
        } catch (error) {
            console.error("Error in transferNFT:", error);
            throw error;
        }
    },

    async updateMetadata(nftId, metadata, updatedBy) {
        try {
            const container = await getContainer();
            const nft = await this.findById(nftId);
            
            if (!nft) {
                throw new ApiError(404, "NFT not found");
            }

            if (nft.creator_id !== updatedBy && !metadata.isAdmin) {
                throw new ApiError(403, "Not authorized to update this NFT");
            }

            const updatedNFT = {
                ...nft,
                metadata: { ...nft.metadata, ...metadata },
                updated_at: new Date()
            };

            const { resource } = await container.items.upsert(updatedNFT);
            return resource;
        } catch (error) {
            console.error("Error in updateMetadata:", error);
            throw error;
        }
    },

    async findByCreatorId(creatorId, options = {}) {
        try {
            const container = await getContainer();
            const { page = 1, limit = 10 } = options;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            const countQuerySpec = {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.creator_id = @creatorId",
                parameters: [{ name: "@creatorId", value: creatorId }]
            };
            
            const { resources: [totalCount] } = await container.items.query(countQuerySpec).fetchAll();

            const querySpec = {
                query: "SELECT * FROM c WHERE c.creator_id = @creatorId ORDER BY c.created_at DESC OFFSET @offset LIMIT @limit",
                parameters: [
                    { name: "@creatorId", value: creatorId },
                    { name: "@offset", value: offset },
                    { name: "@limit", value: parseInt(limit) }
                ]
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            
            return {
                nfts: resources,
                pagination: {
                    total: totalCount || 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil((totalCount || 0) / limit)
                }
            };
        } catch (error) {
            console.error("Error in findByCreatorId:", error);
            throw error;
        }
    },

    async addReview(nftId, review) {
        try {
            const container = await getContainer();
            const nft = await this.findById(nftId);
            
            if (!nft) {
                throw new ApiError(404, "NFT not found");
            }

            const reviews = nft.reviews || [];
            reviews.push({
                ...review,
                created_at: new Date()
            });

            const updatedNFT = {
                ...nft,
                reviews,
                updated_at: new Date()
            };

            const { resource } = await container.items.upsert(updatedNFT);
            return resource;
        } catch (error) {
            console.error("Error in addReview:", error);
            throw error;
        }
    },

    async deleteById(id) {
        try {
            const container = await getContainer();
            console.log("Attempting to delete NFT with ID:", id);

            // First try to find the NFT
            const querySpec = {
                query: "SELECT * FROM c WHERE c.id = @id",
                parameters: [{ name: "@id", value: id }]
            };
            console.log("Query spec:", JSON.stringify(querySpec, null, 2));

            const { resources } = await container.items.query(querySpec).fetchAll();
            console.log("Query results:", JSON.stringify(resources, null, 2));

            const nft = resources[0];
            if (!nft) {
                console.log("NFT not found in database");
                throw new ApiError(404, "NFT not found");
            }

            console.log("Found NFT:", JSON.stringify(nft, null, 2));
            // Use 'nft' as partition key since that's the type for NFT documents
            console.log("Attempting deletion with partition key: nft");

            // Delete using 'nft' as the partition key
            await container.item(id, 'nft').delete();
            console.log("NFT deleted successfully");
            return true;
        } catch (error) {
            console.error("Error in deleteById:", error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Failed to delete NFT");
        }
    },

    async getReviews(nftId, { page = 1, limit = 10 }) {
        try {
            const nft = await this.findById(nftId);
            if (!nft) {
                throw new ApiError(404, "NFT not found");
            }

            const reviews = nft.reviews || [];
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            return {
                reviews: reviews.slice(startIndex, endIndex),
                total: reviews.length,
                page,
                limit
            };
        } catch (error) {
            console.error("Error in getReviews:", error);
            throw error;
        }
    },

    async tokenize(nftId, { token_supply, token_price }) {
        try {
            const container = await getContainer();
            const nft = await this.findById(nftId);
            
            if (!nft) {
                throw new ApiError(404, "NFT not found");
            }

            if (nft.is_tokenized) {
                throw new ApiError(400, "NFT is already tokenized");
            }

            const updatedNFT = {
                ...nft,
                is_tokenized: true,
                token_supply,
                token_price,
                available_tokens: token_supply,
                tokenization_date: new Date(),
                updated_at: new Date()
            };

            const { resource } = await container.items.upsert(updatedNFT);
            return resource;
        } catch (error) {
            console.error("Error in tokenize:", error);
            throw error;
        }
    },

    async createListing(nftId, listingData) {
        try {
            const container = await getContainer();
            
            // First verify NFT exists and is owned by seller
            const nft = await this.findById(nftId);
            if (!nft) {
                throw new ApiError(404, "NFT not found");
            }
            
            if (nft.owner_wallet_id !== listingData.seller_wallet_id) {
                throw new ApiError(403, "Not authorized to list this NFT");
            }

            // Create listing document
            const listingDocument = {
                id: `listing-${Date.now()}`,
                type: 'nft_listing', // Partition key
                nft_id: nftId,
                seller_wallet_id: listingData.seller_wallet_id,
                price: listingData.price,
                duration: listingData.duration,
                expires_at: new Date(Date.now() + listingData.duration * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: listingData.created_by
            };

            // Update NFT status
            const updatedNFT = {
                ...nft,
                status: 'listed',
                current_listing: listingDocument.id,
                updated_at: new Date().toISOString()
            };

            // Create listing and update NFT in transaction
            const batch = [
                { operationType: 'Create', resourceBody: listingDocument },
                { 
                    operationType: 'Replace', 
                    resourceBody: updatedNFT,
                    partitionKey: 'nft'
                }
            ];

            await container.items.bulk(batch);
            return listingDocument;
        } catch (error) {
            console.error("Error in createListing:", error);
            throw error;
        }
    }
};

export default NFTAsset;