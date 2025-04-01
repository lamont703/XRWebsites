import { createUmiClient } from './umi';
import { Connection } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { createGenericFile } from '@metaplex-foundation/umi';

interface MetadataArgs {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  sellerFeeBasisPoints?: number;
}

export async function uploadMetadata(
  connection: Connection,
  wallet: WalletContextState,
  metadata: MetadataArgs,
  options = { network: 'devnet' as 'devnet' | 'mainnet-beta' }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  try {
    const umi = createUmiClient(connection, wallet, options.network);
    console.log("This is the network options if anything...", options.network);

    const metadataJson = {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description || '',
      image: metadata.image || '',
      attributes: metadata.attributes || [],
      seller_fee_basis_points: metadata.sellerFeeBasisPoints || 0,
      properties: {
        files: metadata.image ? [{ uri: metadata.image, type: 'image/png' }] : [],
        category: 'image',
        creators: [{ address: wallet.publicKey.toString(), share: 100 }]
      }
    };

    const file = createGenericFile(
      JSON.stringify(metadataJson),
      'metadata.json',
      { contentType: 'application/json' }
    );

    console.log("This is the file if anything...", file);

    console.log('Uploading metadata to Arweave...', metadataJson);
    const [uri] = await umi.uploader.upload([file]);
    console.log('Metadata uploaded:', uri);
    
    return uri;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    throw error;
  }
} 