import { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { createUmiClient } from '@/lib/solana/umi';
import { useNetwork } from '@/lib/solana/config';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BorshCoder } from '@coral-xyz/anchor';
import { RewardProgramDapp } from '../../../types/reward-program-dapp';

const RewardProgramDappIDL: RewardProgramDapp = {
  version: '0.1.0',
  name: 'reward_program_dapp',
  address: 'RWD1111111111111111111111111111111111111111',
  instructions: [{
    name: 'mintOnboardingNft',
    discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
    accounts: [{
      name: 'recipient',
      isMut: true,
      isSigner: false
    }, {
      name: 'mint',
      isMut: true,
      isSigner: false
    }, {
      name: 'payer',
      isMut: true,
      isSigner: true
    }, {
      name: 'systemProgram',
      isMut: false,
      isSigner: false
    }, {
      name: 'tokenProgram',
      isMut: false,
      isSigner: false
    }, {
      name: 'metadata',
      isMut: true,
      isSigner: false
    }, {
      name: 'tokenMetadataProgram',
      isMut: false,
      isSigner: false
    }, {
      name: 'rent',
      isMut: false,
      isSigner: false
    }],
    args: [{
      name: 'metadata',
      type: {
        defined: { name: 'NftMetadata' }
      }
    }]
  }, {
    name: 'registerReferral',
    discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
    accounts: [{
      name: 'user',
      docs: [],
      isOptional: false,
      isDefinedInRust: true,
      isMut: true,
      isSigner: true
    }, {
      name: 'systemProgram',
      docs: [],
      isOptional: false,
      isDefinedInRust: true,
      isMut: false,
      isSigner: false
    }],
    args: [
      {
        name: 'code',
        type: 'string'
      }
    ]
  }],
  types: [
    {
      name: 'NftMetadata',
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
      name: 'Creator',
      type: {
        kind: 'struct',
        fields: [
          { name: 'address', type: { kind: 'primitive', type: 'publicKey' } },
          { name: 'verified', type: { kind: 'primitive', type: 'bool' } },
          { name: 'share', type: { kind: 'primitive', type: 'u8' } }
        ]
      }
    }
  ],
  metadata: {
    name: 'reward_program_dapp',
    version: '0.1.0',
    spec: '0.1.0',
    address: 'RWD1111111111111111111111111111111111111111'
  }
};

interface OnboardingRewardsProps {
  referralCode?: string;
  onComplete: () => void;
}

export const OnboardingRewards: FC<OnboardingRewardsProps> = ({
  referralCode,
  onComplete
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useNetwork();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeRewards = async () => {
    if (!wallet.publicKey) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Link wallet to user account
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          walletAddress: wallet.publicKey.toString(),
          referralCode 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to link wallet');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to link wallet');
      }

      // 2. Initialize reward router if referral exists
      if (referralCode) {
        const networkType = network === 'mainnet' ? 'mainnet-beta' : 'devnet';
        const umi = createUmiClient(connection, wallet, networkType);
        
        // Call reward router registration
        const provider = new AnchorProvider(connection, wallet as any, {});
        const programId = new PublicKey("RWD1111111111111111111111111111111111111111");
        const coder = new BorshCoder(RewardProgramDappIDL);
        const rewardRouterProgram = new Program(
          RewardProgramDappIDL,
          provider,
          coder
        );

        await rewardRouterProgram.methods
          .registerReferral(referralCode)
          .accounts({
            user: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }

      onComplete();
    } catch (err) {
      console.error('Onboarding rewards error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process rewards');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (wallet.connected && !isProcessing) {
      initializeRewards();
    }
  }, [wallet.connected]);

  return (
    <div className="onboarding-rewards">
      {isProcessing && <div>Processing rewards...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
};
