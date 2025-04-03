// utils/arweaveUploader.js
import {
  createGenericFile,
  createSignerFromKeypair,
  keypairIdentity,
  publicKey,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { bundlrUploader } from '@metaplex-foundation/umi-uploader-bundlr';
import { createMetadataAccountV3, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import base58 from 'bs58';
import dotenv from 'dotenv';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';

dotenv.config();

/**
 * Uploads metadata JSON to Arweave and attaches it to the token
 * @param {Object} metadata - The NFT metadata to upload
 * @param {string} network - 'devnet' or 'mainnet-beta'
 * @param {string} mintAddress - The token's mint address
 * @param {string} userSignature - The user's signature for signature verification
 * @param {string} walletPublicKey - The wallet's public key for signature verification
 * @returns {Promise<{uri: string, signature: string}>} Arweave URI and transaction signature
 */
export const uploadToArweave = async (
  metadataJson, 
  network, 
  mintAddress,
  userSignature,
  walletPublicKey
) => {
  try {
    // Verify the user's signature first
    const message = new TextEncoder().encode(
      `Authorize metadata creation for token: ${mintAddress}`
    );
    const signatureBytes = Buffer.from(userSignature, 'base64');
    const pubKey = new PublicKey(walletPublicKey);
    
    const isValid = nacl.sign.detached.verify(
      message,
      signatureBytes,
      pubKey.toBytes()
    );

    if (!isValid) {
      throw new Error('Invalid signature - unauthorized to create metadata');
    }

    console.log(`Uploading metadataJson with ${network} to Arweave:`, metadataJson);
    
    const secretKey = process.env.BUNDLR_PRIVATE_KEY;
    if (!secretKey) {
      throw new Error('BUNDLR_PRIVATE_KEY not set in .env');
    }

    let uri;
    const keypair = Keypair.fromSecretKey(base58.decode(secretKey));
    const endpoint = getRpcEndpoint(network);
    
    // Create UMI instance with backend wallet
    const umi = createUmi(endpoint);
    const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(keypair));
    umi.use(keypairIdentity(signer))
       .use(mplTokenMetadata());

    // Upload to Arweave first
    if (network === 'devnet') {
      uri = `https://arweave.net/BNttzDav3jHVnNiV7nYbQv-GY0HQ-4XXsdkE5K9ylHQ`;
      console.log('📝 Mock metadata upload (devnet):', uri);
    } else {
      umi.use(bundlrUploader({
        address: 'https://node1.bundlr.network',
        timeout: 60000,
        identity: signer
      }));

      const file = createGenericFile(
        JSON.stringify(metadataJson),
        'metadata.json'
      );

      const [uploadUri] = await umi.uploader.upload([file]);
      uri = uploadUri;
      console.log('📝 Real metadata upload:', uri);
    }

    // Instead of creating metadata here, return the URI and necessary data
    // for the frontend to create the metadata with the user's wallet
    return { 
      uri,
      signature: uri.split('/').pop(), // Use the Arweave transaction ID as signature
      metadata: {
        name: metadataJson.name,
        symbol: metadataJson.symbol,
        uri,
        sellerFeeBasisPoints: metadataJson.seller_fee_basis_points || 0,
        creators: null,
        collection: null,
        uses: null,
      }
    };
  } catch (error) {
    console.error('❌ Failed to upload metadata:', error);
    throw error;
  }
};

function getRpcEndpoint(network) {
  return network === 'mainnet-beta'
    ? 'https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c'
    : 'https://solana-devnet.g.alchemy.com/v2/9W2xUPlDu4DakYXWytaIqTgmNSpGLdtu';
}
