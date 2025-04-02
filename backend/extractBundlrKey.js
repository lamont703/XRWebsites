// extractBundlrKey.js
import { readFileSync } from 'fs';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

// Load and parse the key file
const raw = JSON.parse(readFileSync('./bundlr-keypair.json', 'utf8'));
const secretArray = Uint8Array.from(raw);

let keypair;

if (secretArray.length === 64) {
  // Full secret key (seed + public key)
  keypair = Keypair.fromSecretKey(secretArray);
} else if (secretArray.length === 32) {
  // Only seed provided, generate full keypair from seed
  keypair = Keypair.fromSeed(secretArray);
} else {
  throw new Error(`❌ Unexpected secret key length: ${secretArray.length}`);
}

const base58Secret = bs58.encode(keypair.secretKey);

console.log('✅ BUNDLR_PRIVATE_KEY:', base58Secret);
console.log('🔑 Public Address:', keypair.publicKey.toBase58());
