// utils/arweaveUploader.js
import {
  createGenericFile,
  createSignerFromKeypair,
  keypairIdentity,
} from '@metaplex-foundation/umi';
import {
  createUmi,
} from '@metaplex-foundation/umi-bundle-defaults';
import { bundlrUploader } from '@metaplex-foundation/umi-uploader-bundlr';
import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import { Keypair } from '@solana/web3.js';
import base58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Uploads metadata JSON to Arweave using UMI + Bundlr
 * @param {Object} metadata - The NFT metadata to upload
 * @param {string} network - 'devnet' or 'mainnet-beta'
 * @returns {Promise<string>} Arweave URI
 */
export const uploadToArweave = async (metadataJson, network = 'devnet') => {
  try {
    console.log('Uploading metadataJson to Arweave:', metadataJson);
    // For devnet, use mock storage
    if (network === 'devnet') {
      // Generate a fixed-length mock transaction ID (43 characters)
      //const mockTxId = Buffer.from(JSON.stringify(metadataJson))
      //  .toString('base64')
      //  .replace(/[^a-zA-Z0-9]/g, '')
      //  .slice(0, 43);
      //const mockTxId = 'mockTxId';
      const mockTxId = 'BNttzDav3jHVnNiV7nYbQv-GY0HQ-4XXsdkE5K9ylHQ';
      
      const mockUri = `https://arweave.net/tx/${mockTxId}`;
      console.log('📝 Mock metadata upload (devnet):', mockUri);
      
      // Validate URI length (should be exactly https://arweave.net/ + 43 chars)
      //if (mockUri.length !== 'https://arweave.net/'.length + 43) {
      //  throw new Error('Invalid mock URI length generated');
      //}
      
      return mockUri;
      //  upload for DEVnnet
    //const secretKey = process.env.BUNDLR_PRIVATE_KEY;
    //if (!secretKey) {
    //  throw new Error('BUNDLR_PRIVATE_KEY not set in .env');
    //}

    //const keypair = Keypair.fromSecretKey(base58.decode(secretKey));
    //const umi = createUmi('https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c')
    //  .use(keypairIdentity(keypair))
      //.use(bundlrUploader({
        //address: 'https://node1.bundlr.network',
    //    providerUrl: 'https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c',
    //    timeout: 60000,
    //    }));

      //const file = createGenericFile(
      //JSON.stringify(metadataJson),
      //'metadata.json',
      //{ contentType: 'application/json' }
    //);

    //const [uri] = await umi.uploader.upload([file]);
    //console.log('✅ Metadata uploaded to Arweave:', uri);
    //return uri;
    }

    // Real upload for mainnet
    const secretKey = process.env.BUNDLR_PRIVATE_KEY;
    if (!secretKey) {
      throw new Error('BUNDLR_PRIVATE_KEY not set in .env');
    }

    const keypair = Keypair.fromSecretKey(base58.decode(secretKey));
    const umi = createUmi('https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c')
      .use(keypairIdentity(keypair))
      .use(bundlrUploader({
        address: 'https://node1.bundlr.network',
        providerUrl: 'https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c',
        timeout: 60000,
      }));

    const file = createGenericFile(
      JSON.stringify(metadataJson),
      'metadata.json',
      { contentType: 'application/json' }
    );

    // Get price and fund if needed
    const price = await umi.uploader.getUploadPrice([file]);
    const balance = await umi.uploader.getBundlrBalance();
    
    if (balance < price) {
      const fundAmount = price * BigInt(110) / BigInt(100); // Add 10% buffer
      await umi.uploader.fund(fundAmount);
    }

    const [uri] = await umi.uploader.upload([file]);
    console.log('✅ Metadata uploaded to Arweave:', uri);
    return uri;
  } catch (error) {
    console.error('❌ Failed to upload metadata to Arweave:', error);
    throw error;
  }
};

function getRpcEndpoint(network) {
  return network === 'mainnet-beta'
    ? 'https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c'
    : 'https://solana-devnet.g.alchemy.com/v2/9W2xUPlDu4DakYXWytaIqTgmNSpGLdtu';
}
