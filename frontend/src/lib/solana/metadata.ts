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
  {
    name,
    symbol,
    uri,
    description,
    image,
    sellerFeeBasisPoints = 0
  }: MetadataParams
) {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  try {
    const umi = createUmiClient(connection, wallet);

    // Upload metadata if URI not provided
    let finalUri = uri;
    if (!finalUri) {
      finalUri = await uploadMetadata(connection, wallet, {
        name,
        symbol,
        description,
        image,
        sellerFeeBasisPoints
      });
      return finalUri;
    }

    console.log('Creating metadata with URI:', finalUri);

    // Create metadata with explicit accounts
    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: publicKey(mint.toBase58()),
      mintAuthority: umi.identity,
      payer: umi.identity,
    };

    if (!finalUri || finalUri.length === 0 || finalUri.length > 200) {
            console.log(`Invalid URI provided. It must be a non-empty string and < 200 characters. URI: ${finalUri}`);
    } else {
        console.log('Creating metadata with URI:', finalUri);
        const metadata = await createMetadataAccountV3(umi, {
      ...accounts,
      data: {
        name,
        symbol,
        uri: finalUri,
        sellerFeeBasisPoints,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    }).sendAndConfirm(umi);
    console.log('Metadata created:', metadata);
    return metadata;
    }
  } catch (error) {
    console.error('Failed to create metadata:', error);
    throw error;
  }
}
