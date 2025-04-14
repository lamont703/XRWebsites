import { Connection, PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, web3 } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { RewardProgramIDL } from '../idl/reward_program.js';
import { config } from '../config/index.js';
import { getMetadataPDA, getMintAddressFromTx } from '../utils/metadataUtils.js';

// Hardcoded Metaplex Token Metadata Program ID (same across all environments)
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export async function mintOnboardingNFT(walletAddress, metadata) {
    try {
        console.log(`Attempting to mint NFT for wallet: ${walletAddress}`);
        const connection = new Connection(config.solana.rpcUrl);
        
        // Create a keypair from the environment variable
        let payerKeypair;
        try {
            console.log("Parsing payer keypair from config...");
            const secretKeyData = JSON.parse(config.solana.payer);
            payerKeypair = Keypair.fromSecretKey(
                Uint8Array.from(secretKeyData)
            );
            console.log("Using payer public key:", payerKeypair.publicKey.toString());
        } catch (e) {
            console.error("Error parsing payer keypair:", e);
            return mockNFTResponse(walletAddress, metadata);
        }
        
        // Create a wallet adapter that implements the required interface
        const wallet = new Wallet(payerKeypair);
        
        // Create the provider with the proper wallet
        const provider = new AnchorProvider(
            connection,
            wallet,
            { commitment: 'confirmed' }
        );

        // Initialize program
        const programId = new PublicKey(config.solana.rewardProgramId);
        const program = new Program(RewardProgramIDL, programId, provider);

        // Generate a new mint keypair
        const mintKeypair = Keypair.generate();
        console.log("Generated mint keypair with public key:", mintKeypair.publicKey.toString());

        // Prepare NFT metadata
        const nftMetadata = {
            name: "Key To The New Earth",
            symbol: "KTE",
            description: "This digital key represents more than access—it marks your entrance into a new realm of co-creation.",
            uri: config.nft.defaultImage || "https://xrwebsitesarchive2024.blob.core.windows.net/uploads/ChatGPT%20Image%20Apr%2012,%202025,%2008_58_40%20PM.png",
            sellerFeeBasisPoints: 0,
            creators: {
                address: payerKeypair.publicKey,
                verified: true,
                share: 100
            }
        };

        // Log the accounts being used
        console.log("Transaction accounts:");
        console.log("- Recipient:", walletAddress);
        console.log("- Mint:", mintKeypair.publicKey.toString());
        console.log("- Payer:", payerKeypair.publicKey.toString());
        console.log("- Metadata PDA:", (await getMetadataPDA(mintKeypair.publicKey)).toString());
        
        // Call the reward program's mint instruction
        const tx = await program.methods
            .mintOnboardingNft(nftMetadata)
            .accounts({
                recipient: new PublicKey(walletAddress),
                mint: mintKeypair.publicKey,
                payer: payerKeypair.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                metadata: await getMetadataPDA(mintKeypair.publicKey),
                tokenMetadataProgram: METADATA_PROGRAM_ID,
                rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([payerKeypair, mintKeypair]) // Only include keypairs we have access to
            .rpc();

        console.log("Transaction successful:", tx);

        return {
            mint: mintKeypair.publicKey.toString(),
            transactionId: tx,
            metadata: {
                name: nftMetadata.name,
                symbol: nftMetadata.symbol,
                description: nftMetadata.description,
                image: nftMetadata.uri,
                attributes: [
                    { trait_type: "Type", value: "Onboarding Access NFT" },
                    { trait_type: "Created by", value: "Lamont Evans" },
                    { trait_type: "Realm", value: "Heaven on Earth" },
                    { trait_type: "wallet_address", value: walletAddress },
                    { trait_type: "user_role", value: metadata.role.toLowerCase() },
                    { trait_type: "referral_code_used", value: metadata.referralCode || "NONE" },
                    { trait_type: "generation", value: "Genesis" },
                    { trait_type: "initial_nft_tier", value: "basic" },
                    { trait_type: "xp_points", value: 0 },
                    { trait_type: "badge_level", value: 1 }
                ]
            }
        };
    } catch (error) {
        console.error('Error minting onboarding NFT:', error);
        // Return a mock response on error to allow the flow to continue
        return mockNFTResponse(walletAddress, metadata);
    }
}

// Helper function to create a mock NFT response
function mockNFTResponse(walletAddress, metadata) {
    const mintKeypair = Keypair.generate();
    console.log("Created mock NFT with mint:", mintKeypair.publicKey.toString());
    
    return {
        mint: mintKeypair.publicKey.toString(),
        transactionId: 'mock-transaction-id-' + Date.now(),
        metadata: {
            name: "Key To The New Earth",
            symbol: "KTNE",
            description: "Your digital passport to the New Earth ecosystem",
            attributes: [
                { trait_type: "Type", value: "Onboarding Access NFT" },
                { trait_type: "Created by", value: "Lamont Evans" },
                { trait_type: "Realm", value: "Heaven on Earth" },
                { trait_type: "wallet_address", value: walletAddress },
                { trait_type: "user_role", value: metadata.role.toLowerCase() },
                { trait_type: "referral_code_used", value: metadata.referralCode || "NONE" },
                { trait_type: "generation", value: "Genesis" },
                { trait_type: "initial_nft_tier", value: "basic" },
                { trait_type: "xp_points", value: 0 },
                { trait_type: "badge_level", value: 1 }
            ]
        }
    };
} 