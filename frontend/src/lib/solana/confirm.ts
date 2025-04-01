import { Connection, TransactionSignature, Commitment } from '@solana/web3.js';

const TIMEOUT_MS = 30000; // 30 seconds timeout
const CONFIRMATION_COMMITMENT: Commitment = 'confirmed';
const MAX_RETRIES = 5;
const INITIAL_INTERVAL = 1000; // Start with 1 second

export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  commitment = CONFIRMATION_COMMITMENT,
  timeoutMs = TIMEOUT_MS
): Promise<boolean> {
  const startTime = Date.now();
  let currentInterval = INITIAL_INTERVAL;

  for (let i = 0; i < MAX_RETRIES; i++) {
    if (Date.now() - startTime > timeoutMs) {
      console.log('Transaction confirmation timed out');
      return false;
    }

    try {
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentInterval));
      currentInterval *= 2; // Double the wait time for next attempt

      // Check transaction status
      const response = await connection.getSignatureStatus(signature);
      const status = response?.value;

      if (!status) {
        continue; // Transaction not found yet, try again
      }

      if (status.err) {
        console.error('Transaction failed:', status.err);
        return false;
      }

      if (status.confirmationStatus === commitment) {
        return true;
      }

    } catch (error) {
      console.warn('Error checking transaction status:', error);
      // Continue to next retry
    }
  }

  console.log('Max retries reached without confirmation');
  return false;
}

