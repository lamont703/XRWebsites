import { PublicKey } from '@solana/web3.js';
import { config } from '../config/index.js';

// Hardcoded Metaplex Token Metadata Program ID (same across all environments)
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/**
 * Derives the metadata PDA (Program Derived Address) for a given mint address
 * @param {PublicKey|string} mint - The mint address as PublicKey or string
 * @returns {Promise<PublicKey>} - The metadata account address
 */
export async function getMetadataPDA(mint) {
  const mintKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
  
  // Use the metadata program ID from config or fallback to the hardcoded value
  const metadataProgramId = config.nft.metadataProgram 
    ? new PublicKey(config.nft.metadataProgram) 
    : METADATA_PROGRAM_ID;
  
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      metadataProgramId.toBuffer(),
      mintKey.toBuffer(),
    ],
    metadataProgramId
  );
  
  return metadataPDA;
}

/**
 * Derives the master edition PDA for a given mint address
 * @param {PublicKey|string} mint - The mint address as PublicKey or string
 * @returns {Promise<PublicKey>} - The master edition account address
 */
export async function getMasterEditionPDA(mint) {
  const mintKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
  
  const metadataProgramId = config.nft.metadataProgram 
    ? new PublicKey(config.nft.metadataProgram) 
    : METADATA_PROGRAM_ID;
  
  const [masterEditionPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      metadataProgramId.toBuffer(),
      mintKey.toBuffer(),
      Buffer.from('edition'),
    ],
    metadataProgramId
  );
  
  return masterEditionPDA;
}

/**
 * Extract mint address from a transaction
 * @param {Connection} connection - Solana connection
 * @param {string} txId - Transaction ID
 * @returns {Promise<PublicKey>} - The mint address
 */
export async function getMintAddressFromTx(connection, txId) {
  try {
    const tx = await connection.getTransaction(txId, { commitment: 'confirmed' });
    if (!tx || !tx.meta || !tx.meta.postTokenBalances || tx.meta.postTokenBalances.length === 0) {
      throw new Error('Transaction does not contain token balance information');
    }
    
    // The mint should be in the post token balances
    const mintAddress = tx.meta.postTokenBalances[0].mint;
    return new PublicKey(mintAddress);
  } catch (error) {
    console.error('Error extracting mint address from transaction:', error);
    throw error;
  }
} 