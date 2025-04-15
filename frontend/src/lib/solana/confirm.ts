import { Connection, TransactionSignature } from '@solana/web3.js';

export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  network: 'devnet' | 'mainnet-beta' = 'devnet'
): Promise<boolean> {
  try {
    // Use polling instead of WebSocket subscriptions
    const maxRetries = 30;
    const commitment = network === 'mainnet-beta' ? 'confirmed' : 'processed';
    
    for (let i = 0; i < maxRetries; i++) {
      const signatureStatus = await connection.getSignatureStatus(signature);
      
      // Check if confirmed or finalized
      if (signatureStatus.value?.confirmationStatus === 'confirmed' || 
          signatureStatus.value?.confirmationStatus === 'finalized') {
        return true;
      }
      
      // Check for errors
      if (signatureStatus.value?.err) {
        console.error('Transaction failed:', signatureStatus.value.err);
        return false;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // If we've reached here, transaction didn't confirm in time
    console.error('Transaction confirmation timeout');
    return false;
  } catch (error) {
    console.error('Confirmation error:', error);
    return false;
  }
}

