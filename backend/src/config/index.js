import dotenv from 'dotenv';
dotenv.config();

export const config = {
    solana: {
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        mintAuthorityKey: process.env.SOLANA_MINT_AUTHORITY_KEY,
        cluster: process.env.SOLANA_CLUSTER || 'devnet',
        payer: process.env.SOLANA_PAYER_KEYPAIR,
        rewardProgramId: process.env.REWARD_PROGRAM_ID || 'RWD1111111111111111111111111111111111111111'
    },
    nft: {
        defaultImage: "https://xrwebsitesarchive2024.blob.core.windows.net/uploads/ChatGPT%20Image%20Apr%2012,%202025,%2008_58_40%20PM.png",
        metadataProgram: process.env.METADATA_PROGRAM_ID,
        tokenProgram: process.env.TOKEN_PROGRAM_ID
    }
}; 