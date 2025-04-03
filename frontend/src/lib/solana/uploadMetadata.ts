import { Connection } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { createUmiClient } from './umi';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';

interface MetadataArgs {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  sellerFeeBasisPoints?: number;
}

export async function uploadMetadata(
  _connection: Connection,
  wallet: WalletContextState,
  metadata: MetadataArgs,
  mintAddress: string,
  options: { network: 'devnet' | 'mainnet-beta' }
): Promise<string> {
  if (!wallet.publicKey || !wallet.signMessage) throw new Error('Wallet not connected or cannot sign');

  try {
    // Create and sign authorization message
    const message = new TextEncoder().encode(
      `Authorize metadata creation for token: ${mintAddress}`
    );
    const signature = await wallet.signMessage(message);
    const userSignature = Buffer.from(signature).toString('base64');

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

    console.log('Sending metadata to backend for upload...', metadataJson);
    
    // Send metadata to backend for upload
    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/metadata/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Signature': userSignature,
        'X-Wallet-Public-Key': wallet.publicKey.toString()
      },
      body: JSON.stringify({
        metadataJson,
        network: options.network,
        mintAddress
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to upload metadata: ${response.statusText}`);
    }

    //console.log('Response:', await response.json());


    const data = await response.json();
    if (!data?.data?.uri) {
      throw new Error('Invalid response from metadata upload');
    }
    const uri = data.data.uri;
    console.log('Metadata uploaded:', uri);
    
    return uri;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    throw error;
  }
}

export async function createMetadata(
  connection: Connection,
  wallet: WalletContextState,
  { uri, mintAddress, metadata }: { 
    uri: string, 
    mintAddress: string, 
    metadata: any 
  }
) {
  const umi = createUmiClient(connection, wallet);
  
  const tx = await createMetadataAccountV3(umi, {
    mint: publicKey(mintAddress),
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
  }).sendAndConfirm(umi);

  return tx.signature;
} 