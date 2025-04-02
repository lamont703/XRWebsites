import { Connection } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

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
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        metadataJson: metadataJson,
        network: options.network
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to upload metadata: ${response.statusText}`);
    }

    //console.log('Response:', await response.json());


    const data = await response.json();
    const uri = data?.data?.uri;
    console.log('Metadata uploaded:', uri);
    
    return uri;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    throw error;
  }
} 