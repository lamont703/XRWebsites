import { Keypair } from '@solana/web3.js';
import fs from 'fs';

// Generate a new random keypair
const keypair = Keypair.generate();

// Convert the secret key to an array
const secretKeyArray = Array.from(keypair.secretKey);

// Save the keypair to a file
const keypairData = {
  publicKey: keypair.publicKey.toString(),
  secretKey: secretKeyArray
};

// Write to a JSON file
fs.writeFileSync('keypair.json', JSON.stringify(keypairData, null, 2));

// Also output the secret key in the format needed for the environment variable
console.log('Public Key:', keypair.publicKey.toString());
console.log('Secret Key for .env:', JSON.stringify(secretKeyArray)); 