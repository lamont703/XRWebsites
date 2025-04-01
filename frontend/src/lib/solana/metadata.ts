import { publicKey } from '@metaplex-foundation/umi';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { createUmiClient } from './umi';
import { uploadMetadata } from './uploadMetadata';
import { Connection, PublicKey } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

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
  }: {
    name: string;
    symbol: string;
    uri?: string;
    description?: string;
    image?: string;
    sellerFeeBasisPoints?: number;
  }
) {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
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
      }

      const metadata = await createMetadataAccountV3(umi, {
        mint: publicKey(mint.toBase58()),
        mintAuthority: umi.identity,
        updateAuthority: publicKey(umi.identity.publicKey.toString()),
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

      return metadata;
    } catch (error) {
      attempt++;
      if (
        error instanceof Error &&
        error.message?.includes('block height exceeded') &&
        attempt < MAX_RETRIES
      ) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to create metadata after maximum retries');
}
