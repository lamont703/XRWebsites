export const getNetworkConfig = (network = process.env.SOLANA_NETWORK || 'devnet') => {
    const config = {
        network,
        rpcUrl: process.env.SOLANA_RPC_URL,
        wsUrl: process.env.SOLANA_WS_URL,
        isDevnet: network === 'devnet',
        isMainnet: network === 'mainnet-beta'
    };

    // Override with Alchemy URLs if available
    if (network === 'mainnet-beta' && process.env.ALCHEMY_SOLANA_MAINNET_URL) {
        config.rpcUrl = process.env.ALCHEMY_SOLANA_MAINNET_URL;
    } else if (network === 'devnet' && process.env.ALCHEMY_SOLANA_DEVNET_URL) {
        config.rpcUrl = process.env.ALCHEMY_SOLANA_DEVNET_URL;
    }

    return config;
}; 