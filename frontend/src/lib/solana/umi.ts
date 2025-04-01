// lib/solana/umi.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { web3JsRpc } from '@metaplex-foundation/umi-rpc-web3js';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { bundlrUploader } from '@metaplex-foundation/umi-uploader-bundlr';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';

export const createUmiClient = (
  connection: Connection, 
  wallet: WalletContextState,
  network: 'devnet' | 'mainnet-beta' = 'devnet'
) => {
  const umi = createUmi(connection.rpcEndpoint)
    .use(web3JsRpc(connection.rpcEndpoint))
    .use(walletAdapterIdentity(wallet))
    .use(mplTokenMetadata())
    .use(bundlrUploader({
      address: network === 'devnet' 
        ? 'https://devnet.bundlr.network'
        : 'https://node1.bundlr.network',
      providerUrl: network === 'devnet'
        ? 'https://solana-devnet.g.alchemy.com/v2/9W2xUPlDu4DakYXWytaIqTgmNSpGLdtu'
        : 'https://solana-mainnet.core.chainstack.com/4d36293a8e6eef86281f61a73c33af5c',
      timeout: 60000,
      priceMultiplier: 1.1
    }));

  return umi;
};
