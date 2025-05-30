import { getContainer } from "../database.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Wallet from "../models/wallet.models.js";
import ApiResponse from "../utils/ApiResponse.js";
import Transaction from "../models/transaction.models.js";
import NFTAsset from "../models/nftAsset.models.js";

const getWallet = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    try {
        const container = await getContainer();
        
        // Query using Cosmos DB syntax
        const { resources: wallets } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.user_id = @userId",
                parameters: [{ name: "@userId", value: userId }]
            })
            .fetchAll();

        const wallet = wallets[0];
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        return res.json(new ApiResponse(200, wallet, "Wallet retrieved successfully"));
    } catch (error) {
        console.error('Wallet lookup error:', error);
        throw new ApiError(500, "Failed to retrieve wallet");
    }
});

const getWalletById = asyncHandler(async (req, res) => {
    const wallet = await Wallet.findOne({ _id: req.params.id });
    
    if (!wallet) {
        throw new ApiError(404, "Wallet not found");
    }

    return res.status(200).json({
        success: true,
        data: wallet
    });
});

const getWalletTransactions = asyncHandler(async (req, res) => {
    const { walletId } = req.params;
    
    try {
        const container = await getContainer();
        
        // First verify wallet exists
        const { resources: wallets } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.id = @walletId",
                parameters: [{ name: "@walletId", value: walletId }]
            })
            .fetchAll();

        if (wallets.length === 0) {
            throw new ApiError(404, "Wallet not found");
        }

        // Get transactions
        const { resources: transactions } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type = 'transaction' AND c.wallet_id = @walletId ORDER BY c._ts DESC",
                parameters: [{ name: "@walletId", value: walletId }]
            })
            .fetchAll();

        return res.json(new ApiResponse(200, {
            transactions,
            stats: {
                total: transactions.length,
                // Add any other stats you need
            }
        }, "Transactions retrieved successfully"));
    } catch (error) {
        console.error('Error retrieving transactions:', error);
        throw new ApiError(500, "Failed to retrieve transactions");
    }
});

const createWallet = asyncHandler(async (req, res) => {
    // Get user_id from authenticated user instead of request body
    const user_id = req.user.id;

    try {
        // Check if wallet already exists for user
        const existingWallet = await Wallet.findOne({ user_id });
        if (existingWallet) {
            throw new ApiError(409, "Wallet already exists for this user");
        }

        // Create new wallet with user_id
        const wallet = await Wallet.create({
            id: `wallet-${Date.now()}`,
            user_id,  // This links the wallet to the user
            balance: 0,
            created_at: new Date(),
            updated_at: new Date(),
            linked_accounts: [],
            status: "active",
            type: 'wallet'  // Added type for consistency
        });

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    "Wallet created successfully",
                    wallet
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to create wallet"
        );
    }
});

const connectExternalWallet = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { external_wallet_address, wallet_type } = req.body;

    try {
        const wallet = await Wallet.findById(id);
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        // Check if user is admin or wallet owner
        const isAdmin = req.user.isAdmin === true;
        const isOwner = wallet.user_id === req.user.id;

        if (!isAdmin && !isOwner) {
            throw new ApiError(403, "Unauthorized to modify this wallet");
        }

        // Add external wallet to linked accounts
        const linkedAccount = {
            address: external_wallet_address,
            type: wallet_type,
            connected_at: new Date()
        };

        const updatedWallet = await Wallet.updateOne(
            { id },
            {
                linked_accounts: [...wallet.linked_accounts, linkedAccount],
                updated_at: new Date()
            }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "External wallet connected successfully",
                    updatedWallet
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to connect external wallet"
        );
    }
});

const depositTokens = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, source, transaction_hash } = req.body;

    try {
        const wallet = await Wallet.findById(id);
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        // Verify ownership
        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }

        // Update wallet balance
        const updatedWallet = await Wallet.updateBalance(id, parseFloat(amount));

        // Record transaction
        await Wallet.recordTransaction(id, "deposit", amount, {
            source,
            transaction_hash,
            external_reference: transaction_hash
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Deposit successful",
                    updatedWallet
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to process deposit"
        );
    }
});

const withdrawTokens = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, destination_address } = req.body;

    try {
        const wallet = await Wallet.findById(id);
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        // Verify ownership
        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }

        // Update wallet balance (negative amount for withdrawal)
        const updatedWallet = await Wallet.updateBalance(id, -parseFloat(amount));

        // Record transaction
        await Wallet.recordTransaction(id, "withdrawal", -amount, {
            destination_address,
            status: "processing"
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Withdrawal initiated successfully",
                    updatedWallet
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to process withdrawal"
        );
    }
});

const transferTokens = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, recipient_wallet_id, recipient_address } = req.body;

    try {
        const sourceWallet = await Wallet.findById(id);
        if (!sourceWallet) {
            throw new ApiError(404, "Source wallet not found");
        }

        // Verify ownership
        if (sourceWallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }

        // Deduct from source wallet
        const updatedSourceWallet = await Wallet.updateBalance(id, -parseFloat(amount));

        // If internal transfer
        if (recipient_wallet_id) {
            const recipientWallet = await Wallet.findById(recipient_wallet_id);
            if (!recipientWallet) {
                throw new ApiError(404, "Recipient wallet not found");
            }
            await Wallet.updateBalance(recipient_wallet_id, parseFloat(amount));
        }

        // Record transaction
        await Wallet.recordTransaction(id, "transfer", -amount, {
            recipient_wallet_id,
            recipient_address,
            status: "completed"
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Transfer completed successfully",
                    updatedSourceWallet
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to process transfer"
        );
    }
});

const getTransactionHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const wallet = await Wallet.findById(id);
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        // Verify ownership
        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }

        // Get transactions with pagination
        const transactions = await Transaction.findByWalletId(id, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        // Get total count for pagination
        const totalTransactions = await Transaction.countByWalletId(id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Transaction history retrieved successfully",
                    {
                        transactions,
                        pagination: {
                            total: totalTransactions,
                            page: parseInt(page),
                            limit: parseInt(limit),
                            pages: Math.ceil(totalTransactions / limit)
                        }
                    }
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to retrieve transaction history"
        );
    }
});

const transferNFT = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nft_id, recipient_wallet_id } = req.body;

    try {
        // Verify wallet ownership
        const wallet = await Wallet.findById(id);
        if (!wallet) {
            throw new ApiError(404, "Source wallet not found");
        }

        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }

        // Verify recipient wallet exists
        const recipientWallet = await Wallet.findById(recipient_wallet_id);
        if (!recipientWallet) {
            throw new ApiError(404, "Recipient wallet not found");
        }

        // Transfer NFT
        const transferredNFT = await NFTAsset.transferNFT(
            nft_id,
            id,
            recipient_wallet_id
        );

        // Record transaction
        await Wallet.recordTransaction(id, "nft_transfer", 0, {
            nft_id,
            recipient_wallet_id,
            status: "completed"
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "NFT transferred successfully",
                    transferredNFT
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to transfer NFT"
        );
    }
});

const getNFTs = asyncHandler(async (req, res) => {
    try {
        const { walletId } = req.params;
        const container = await getContainer();
        
        // Verify wallet ownership
        const { resources: wallets } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type = 'wallet' AND c.id = @walletId",
                parameters: [{ name: "@walletId", value: walletId }]
            })
            .fetchAll();
            
        const wallet = wallets[0];
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }
        
        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }
        
        // Get NFTs owned by this wallet
        const { resources: nfts } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type = 'nft' AND c.owner_wallet_id = @walletId",
                parameters: [{ name: "@walletId", value: walletId }]
            })
            .fetchAll();
        
        // Return empty array instead of error if no NFTs found
        return res.json(
            new ApiResponse(200, { nfts: nfts || [] }, "NFTs retrieved successfully")
        );
    } catch (error) {
        console.error("Error fetching NFTs:", error);
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to retrieve NFTs"
        );
    }
});

const createNFT = asyncHandler(async (req, res) => {
    const { id } = req.params; // wallet id
    const { 
        name, 
        description, 
        image_url, 
        value,
        metadata 
    } = req.body;

    try {
        // Verify wallet ownership
        const wallet = await Wallet.findById(id);
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }

        // Create NFT with proper wallet connection and metadata
        const nft = await NFTAsset.create({
            name,
            description,
            image_url,
            value: parseFloat(value) || 0,
            owner_wallet_id: id,
            creator_id: req.user.id,
            metadata: {
                ...metadata,
                name,
                description,
                imageUrl: image_url,
                value: parseFloat(value) || 0
            }
        });

        // Record transaction
        await Wallet.recordTransaction(id, "nft_mint", 0, {
            nft_id: nft.id,
            status: "completed"
        });

        return res
            .status(201)
            .json(new ApiResponse(201, "NFT created successfully", nft));
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to create NFT"
        );
    }
});

const updateWalletBalance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    try {
        const wallet = await Wallet.findOne({ id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        // Verify ownership or admin status
        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to modify this wallet");
        }

        const updatedWallet = await Wallet.findOneAndUpdate(
            { id },
            { 
                $inc: { balance: parseFloat(amount) },
                $set: { updated_at: new Date() }
            },
            { new: true }
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                "Wallet balance updated successfully",
                updatedWallet
            )
        );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to update wallet balance"
        );
    }
});

const getRecentTransactions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { days = 30 } = req.query;

    try {
        const wallet = await Wallet.findById(id);
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        // Verify ownership
        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }

        // Get recent transactions
        const transactions = await Transaction.findRecentByWalletId(id, parseInt(days));
        const stats = await Transaction.getTransactionStats(id, parseInt(days));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Recent transactions retrieved successfully",
                    {
                        transactions,
                        stats,
                        period: {
                            days: parseInt(days),
                            start: new Date(Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000)),
                            end: new Date()
                        }
                    }
                )
            );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to retrieve recent transactions"
        );
    }
});

const listNFTForSale = asyncHandler(async (req, res) => {
    const { walletId, nftId } = req.params;
    const { price, duration } = req.body;

    try {
        // Verify wallet ownership
        const wallet = await Wallet.findById(walletId);
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        if (wallet.user_id !== req.user.id && !req.user.isAdmin) {
            throw new ApiError(403, "Unauthorized to access this wallet");
        }

        // Create listing using NFTAsset model
        const listing = await NFTAsset.createListing(nftId, {
            seller_wallet_id: walletId,
            price: parseFloat(price),
            duration: parseInt(duration),
            status: 'active',
            created_by: req.user.id
        });

        // Record transaction in wallet
        await Wallet.recordTransaction(walletId, "nft_list", 0, {
            nft_id: nftId,
            listing_id: listing.id,
            price: price,
            status: "listed"
        });

        return res
            .status(201)
            .json(new ApiResponse(201, "NFT listed successfully", listing));
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to list NFT"
        );
    }
});

const checkOnboardingNFT = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        const container = await getContainer();

        // Check onboarding status
        const { resources: onboardingStatus } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type = 'onboarding' AND c.user_id = @userId AND c.status = 'completed'",
                parameters: [{ name: "@userId", value: userId }]
            })
            .fetchAll();

        return res.json(
            new ApiResponse(200, { 
                onboardingComplete: onboardingStatus.length > 0,
                hasOnboardingNFT: onboardingStatus.length > 0 && onboardingStatus[0].nft_mint_address !== null
            }, "Onboarding status checked successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Failed to check onboarding status");
    }
});

export {
    getWallet,
    getWalletById,
    getWalletTransactions,
    createWallet,
    connectExternalWallet,
    depositTokens,
    withdrawTokens,
    transferTokens,
    getTransactionHistory,
    transferNFT,
    getNFTs,
    createNFT,
    updateWalletBalance,
    getRecentTransactions,
    listNFTForSale,
    checkOnboardingNFT
}; 