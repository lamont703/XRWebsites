import { Connection, TransactionSignature } from '@solana/web3.js';

export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  network: 'devnet' | 'mainnet-beta' = 'devnet'
): Promise<boolean> {
  const commitment = network === 'mainnet-beta' ? 'confirmed' : 'processed';
  
  try {
    const latestBlockhash = await connection.getLatestBlockhash();
    
    // Increase timeout for mainnet
    const timeout = network === 'mainnet-beta' ? 90000 : 60000; // 90 seconds for mainnet
    
    // Use more robust confirmation strategy
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    }, commitment);

    // Check for various error conditions
    if (confirmation.value.err) {
      // If block height exceeded, suggest retry
      if (confirmation.value.err.toString().includes('block height exceeded')) {
        throw new Error('Transaction expired due to network congestion. Please try again.');
      }
      console.error('Transaction failed:', confirmation.value.err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Confirmation failed:', error);
    // Specific error handling for block height exceeded
    if (error instanceof Error && error.message.includes('block height exceeded')) {
      throw new Error('Transaction expired due to network congestion. Please try again.');
    }
    return false;
  }
}

