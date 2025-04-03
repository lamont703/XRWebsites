// attachMetadata.js

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { createSignerFromKeypair, keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

const BUNDLR_PRIVATE_KEY = process.env.BUNDLR_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com'; // Or your mainnet endpoint

// === 🧠 UPDATE THESE ===
const mintAddress = 'AekMbdvQqb3X7NVpXzQhdYqbYkz29WTSQb4KqjrhPTz4';
const metadataUri = 'https://arweave.net/96k1aRgmxzh_aF0Qw-VwyYOEtbM88tHAZad32t2EHFA';
const name = 'Nasir Token';
const symbol = '$NAS';
const description = 'This is Nasir\'s token';
// =======================

export async function attachMetadata(mintAddress, metadataUri, {}) {
  if (!BUNDLR_PRIVATE_KEY) throw new Error('Missing BUNDLR_PRIVATE_KEY in .env');

  const secretKey = bs58.decode(BUNDLR_PRIVATE_KEY);
  const keypair = Keypair.fromSecretKey(secretKey);
  const umi = createUmi(RPC_URL);
    const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(keypair));
    umi.use(keypairIdentity(signer));


  const accounts = {
    mint: publicKey(mintAddress),
    mintAuthority: umi.identity,
    payer: umi.identity,
  };

  console.log('🔗 Creating metadata account for:', mintAddress);
  console.log('📄 Metadata URI:', metadataUri);

  const tx = await createMetadataAccountV3(umi, {
    ...accounts,
    data: {
      name,
      symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);

  




  console.log('✅ Metadata successfully attached!');
  console.log('📦 Transaction Signature:', tx.signature);
}

attachMetadata().catch(err => {
  console.error('❌ Failed to attach metadata:', err);
});
