import { Idl } from '@coral-xyz/anchor';

export type RewardProgramDapp = Idl & {
  version: '0.1.0';
  name: 'reward_program_dapp';
  address: string;
  instructions: [
    {
      name: 'mintOnboardingNft';
      discriminator: [number, number, number, number, number, number, number, number];
      accounts: [
        {
          name: 'recipient';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'metadata';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenMetadataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'metadata';
          type: {
            defined: { name: 'NftMetadata' };
          };
        }
      ];
    },
    {
      name: 'registerReferral';
      discriminator: [number, number, number, number, number, number, number, number];
      accounts: [
        {
          name: 'user';
          docs: string[];
          isOptional: boolean;
          isDefinedInRust: boolean;
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          docs: string[];
          isOptional: boolean;
          isDefinedInRust: boolean;
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'code';
          type: 'string';
        }
      ];
    }
  ];
  types: [
    {
      name: 'NftMetadata';
      type: {
        kind: 'struct',
        fields: [
          { name: 'name', type: { kind: 'primitive', type: 'string' } },
          { name: 'symbol', type: { kind: 'primitive', type: 'string' } },
          { name: 'uri', type: { kind: 'primitive', type: 'string' } },
          { name: 'sellerFeeBasisPoints', type: { kind: 'primitive', type: 'u16' } },
          { name: 'creators', type: { defined: { name: 'Creator' } } }
        ]
      }
    },
    {
      name: 'Creator';
      type: {
        kind: 'struct',
        fields: [
          { name: 'address', type: { kind: 'primitive', type: 'publicKey' } },
          { name: 'verified', type: { kind: 'primitive', type: 'bool' } },
          { name: 'share', type: { kind: 'primitive', type: 'u8' } }
        ]
      }
    }
  ];
  metadata: {
    name: 'reward_program_dapp';
    version: '0.1.0';
    spec: '0.1.0';
    address: 'RWD1111111111111111111111111111111111111111';
  };
}; 