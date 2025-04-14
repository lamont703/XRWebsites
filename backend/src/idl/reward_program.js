import { PublicKey } from '@solana/web3.js';

export const RewardProgramIDL = {
  version: '0.1.0',
  name: 'reward_program_dapp',
  instructions: [{
    name: 'mintOnboardingNft',
    accounts: [{
      name: 'recipient',
      isMut: true,
      isSigner: false
    },
    {
      name: 'mint',
      isMut: true,
      isSigner: false
    },
    {
      name: 'payer',
      isMut: true,
      isSigner: true
    },
    {
      name: 'systemProgram',
      isMut: false,
      isSigner: false
    },
    {
      name: 'tokenProgram',
      isMut: false,
      isSigner: false
    },
    {
      name: 'metadata',
      isMut: true,
      isSigner: false
    },
    {
      name: 'tokenMetadataProgram',
      isMut: false,
      isSigner: false
    },
    {
      name: 'rent',
      isMut: false,
      isSigner: false
    }],
    args: [{
      name: 'metadata',
      type: {
        defined: 'NftMetadata'
      }
    }]
  }],
  types: [{
    name: 'NftMetadata',
    type: {
      kind: 'struct',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'symbol', type: 'string' },
        { name: 'uri', type: 'string' },
        { name: 'sellerFeeBasisPoints', type: 'u16' },
        { name: 'creators', type: { defined: 'Creator' } },
      ]
    }
  },
  {
    name: 'Creator',
    type: {
      kind: 'struct',
      fields: [
        { name: 'address', type: 'publicKey' },
        { name: 'verified', type: 'bool' },
        { name: 'share', type: 'u8' }
      ]
    }
  }]
}; 