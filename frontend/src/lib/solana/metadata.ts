import { publicKey } from '@metaplex-foundation/umi';
import { createMetadataAccountV3, CreateMetadataAccountV3InstructionAccounts } from '@metaplex-foundation/mpl-token-metadata';
import { createUmiClient } from './umi';
import { uploadMetadata } from './uploadMetadata';
import { Connection, PublicKey } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

interface MetadataParams {
  name: string;
  symbol: string;
  uri?: string;
  description?: string;
  image?: string;
  sellerFeeBasisPoints?: number;
}

export async function createTokenMetadata(
  connection: Connection,
  wallet: WalletContextState,
  mint: PublicKey,
  metadata: MetadataParams,
  network: 'devnet' | 'mainnet-beta' = 'devnet'
) {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  try {
    const uri = await uploadMetadata(
      connection,
      wallet,
      metadata,
      mint.toBase58(),
      { network }
    );

    const umi = createUmiClient(connection, wallet, network);
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    
    const tx = await createMetadataAccountV3(umi, {
      mint: publicKey(mint.toBase58()),
      mintAuthority: umi.identity,
      payer: umi.identity,
      data: {
        name: metadata.name,
        symbol: metadata.symbol,
        uri,
        sellerFeeBasisPoints: metadata.sellerFeeBasisPoints || 0,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    }).sendAndConfirm(umi, {
      confirm: { commitment: 'confirmed' }
    });

    return tx.signature;
  } catch (error) {
    console.error('Failed to create metadata:', error);
    throw error;
  }
}
