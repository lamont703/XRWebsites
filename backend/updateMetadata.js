// updateMetadata.js

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { updateMetadataAccountV2 } from '@metaplex-foundation/mpl-token-metadata';
import { createSignerFromKeypair, keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

const BUNDLR_PRIVATE_KEY = process.env.BUNDLR_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com'; // Or mainnet

// === 🧠 UPDATE THESE ===
const mintAddress = 'AekMbdvQqb3X7NVpXzQhdYqbYkz29WTSQb4KqjrhPTz4';
const newMetadataUri = 'https://arweave.net/NEW_IMAGE_URI_HERE'; // <-- Replace with your new URI
const name = 'Nasir Token';
const symbol = '$NAS';
const sellerFeeBasisPoints = 0; // Still 0 unless adding royalties
// =======================

async function updateMetadata() {
  if (!BUNDLR_PRIVATE_KEY) throw new Error('Missing BUNDLR_PRIVATE_KEY in .env');

  const secretKey = bs58.decode(BUNDLR_PRIVATE_KEY);
  const keypair = Keypair.fromSecretKey(secretKey);

  const umi = createUmi(RPC_URL);
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(keypair));
  umi.use(keypairIdentity(signer));

  const mint = publicKey(mintAddress);

  console.log('🔁 Updating metadata for:', mintAddress);
  console.log('🌐 New URI:', newMetadataUri);

  const tx = await updateMetadataAccountV2(umi, {
    metadata: publicKey.findProgramAddressSync(
      ['metadata', 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', mint.toString()],
      publicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    )[0],
    updateAuthority: umi.identity,
    data: {
      name,
      symbol,
      uri: newMetadataUri,
      sellerFeeBasisPoints,
      creators: null,
      collection: null,
      uses: null
    },
    isMutable: true
  }).sendAndConfirm(umi);

  console.log('✅ Metadata successfully updated!');
  console.log('📦 Transaction Signature:', tx.signature);
}

updateMetadata().catch(err => {
  console.error('❌ Failed to update metadata:', err);
});
