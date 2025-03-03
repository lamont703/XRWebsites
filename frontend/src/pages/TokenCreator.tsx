import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';
import { 
  getMint,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMintToInstruction
} from '@solana/spl-token';
import { PublicKey, Transaction, Keypair, Connection, SystemProgram } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletContextState } from '@solana/wallet-adapter-react';

interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  initialOwner: string;
  tokenType: 'fungible' | 'non-fungible';
  features: {
    freezable: boolean;
    mintable: boolean;
    immutable: boolean;
    burnable: boolean;
  };
  metadata: {
    description: string;
    website?: string;
    image?: string;
  };
  distribution: {
    initialPrice: number;
    presaleAllocation: number;
    publicAllocation: number;
    teamAllocation: number;
  };
  economics: {
    maxSupply: number;
    inflationRate: number;
    transactionFee: number;
  };
}

const testTokenConfig = {
  name: "Test Token",
  symbol: "TEST",
  decimals: 9,
  totalSupply: 1000000,
  features: {
    mintable: false,
    freezable: false,
    burnable: false,
    immutable: true
  }
};

// Create a reusable signer function
export const createWalletSigner = (wallet: WalletContextState, connection: Connection) => {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error('Wallet is not properly connected');
  }

  return {
    publicKey: wallet.publicKey,
    secretKey: new Uint8Array(32), // Required by Signer interface but not used
    async signTransaction(tx: Transaction) {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }
      
      tx.feePayer = wallet.publicKey!;
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;

      return wallet.signTransaction(tx);
    },
    async signAllTransactions(txs: Transaction[]) {
      if (!wallet.signAllTransactions) {
        throw new Error('Wallet does not support signing multiple transactions');
      }
      
      const recentBlockhash = await connection.getLatestBlockhash('finalized');
      txs.forEach(tx => {
        tx.feePayer = wallet.publicKey!;
        tx.recentBlockhash = recentBlockhash.blockhash;
      });

      return wallet.signAllTransactions(txs);
    }
  };
};

// Add this helper function at the top of the file
const confirmTransaction = async (
  connection: Connection,
  signature: string
) => {
  const start = Date.now();
  const timeout = 30000; // 30 second timeout

  while (Date.now() - start < timeout) {
    const confirmation = await connection.getSignatureStatus(signature);
    
    if (confirmation?.value?.confirmationStatus === 'confirmed' || 
        confirmation?.value?.confirmationStatus === 'finalized') {
      return true;
    }

    if (confirmation?.value?.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }

    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Transaction confirmation timeout');
};

// Add these debug functions at the top of TokenCreator.tsx after imports
const debugTransaction = (tx: Transaction) => {
  console.log('📝 Transaction Debug:', {
    recentBlockhash: tx.recentBlockhash,
    feePayer: tx.feePayer?.toString(),
    instructions: tx.instructions.map(ix => ({
      programId: ix.programId.toString(),
      keys: ix.keys.map(k => k.pubkey.toString())
    }))
  });
};

const createTokenAccount = async (
    connection: Connection,
    wallet: WalletContextState,
    mintPubkey: PublicKey
) => {
    console.log('🏦 Creating associated token account...');
    try {
        // Get the ATA address
        const [associatedTokenAddress] = PublicKey.findProgramAddressSync(
            [
                wallet.publicKey!.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                mintPubkey.toBuffer(),
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        
        console.log('📝 Associated Token Address:', associatedTokenAddress.toString());

        // Create instruction with explicit program IDs
        const ix = createAssociatedTokenAccountInstruction(
            wallet.publicKey!,         // payer
            associatedTokenAddress,     // ata
            wallet.publicKey!,         // owner
            mintPubkey,                // mint
            TOKEN_PROGRAM_ID,          // token program id
            ASSOCIATED_TOKEN_PROGRAM_ID // ata program id
        );

        // Create and configure transaction
        const transaction = new Transaction();
        transaction.add(ix);
        
        // Get latest blockhash with lastValidBlockHeight
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey!;

        console.log('📝 Transaction created with instruction:', {
            programId: ix.programId.toString(),
            keys: ix.keys.map(k => k.pubkey.toString())
        });

        const signed = await wallet.signTransaction!(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        // Use our existing confirmTransaction helper
        const confirmed = await confirmTransaction(
            connection,
            signature
        );

        if (!confirmed) {
            throw new Error('Transaction confirmation timeout');
        }

        console.log('✅ Token account created:', associatedTokenAddress.toString());
        return associatedTokenAddress;
    } catch (err) {
        console.error('Detailed token account creation error:', err);
        throw new Error(`Failed to create token account: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
};

const handleMintTokens = async (
    connection: Connection,
    wallet: WalletContextState,
    mintKeypair: Keypair,
    tokenAccount: PublicKey,
    amount: bigint
) => {
    console.log('💰 Creating mint instruction...');
    
    try {
        // Get mint info first
        const mintInfo = await getMint(connection, mintKeypair.publicKey);
        console.log('📝 Mint info:', {
            mintAuthority: mintInfo.mintAuthority?.toString(),
            freezeAuthority: mintInfo.freezeAuthority?.toString(),
            decimals: mintInfo.decimals
        });

        // Create the mint instruction
        const mintIx = createMintToInstruction(
            mintKeypair.publicKey,    // mint
            tokenAccount,             // destination
            wallet.publicKey!,        // authority
            amount                    // amount
        );

        const transaction = new Transaction().add(mintIx);
        const latestBlockhash = await connection.getLatestBlockhash('confirmed');
        
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = wallet.publicKey!;

        const signed = await wallet.signTransaction!(transaction);
        const rawTransaction = signed.serialize();

        // Send with specific options for Alchemy
        const signature = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 5,
            preflightCommitment: 'processed'
        });

        console.log('📤 Mint transaction sent:', signature);

        // Poll for confirmation instead of using subscription
        let confirmed = false;
        let retries = 30;
        
        while (!confirmed && retries > 0) {
            const status = await connection.getSignatureStatus(signature);
            
            if (status?.value?.confirmationStatus === 'confirmed' || 
                status?.value?.confirmationStatus === 'finalized') {
                confirmed = true;
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
        }

        if (!confirmed) {
            throw new Error('Transaction confirmation timeout');
        }

        console.log('✅ Tokens minted successfully');
    } catch (error) {
        console.error('Mint tokens error:', error);
        throw error;
    }
};

export const TokenCreator = () => {
  const {} = useAuth();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    name: '',
    symbol: '',
    decimals: 9,
    totalSupply: 0,
    initialOwner: '',
    tokenType: 'fungible',
    features: {
      freezable: false,
      mintable: false,
      immutable: false,
      burnable: false
    },
    metadata: {
      description: '',
      website: '',
      image: ''
    },
    distribution: {
      initialPrice: 0,
      presaleAllocation: 0,
      publicAllocation: 0,
      teamAllocation: 0
    },
    economics: {
      maxSupply: 0,
      inflationRate: 0,
      transactionFee: 0
    }
  });

  const { connection } = useConnection();

  const checkWalletCapabilities = () => {
    if (!wallet.connected) {
      console.log('❌ Wallet not connected');
      return false;
    }
    
    if (!wallet.publicKey) {
      console.log('❌ No public key available');
      return false;
    }
    
    if (!wallet.signTransaction || !wallet.signAllTransactions) {
      console.log('❌ Wallet missing signing capabilities');
      return false;
    }

    const publicKeyString = wallet.publicKey.toString();
    console.log('✅ Wallet capabilities verified:', {
      connected: true,
      publicKey: publicKeyString,
      signTransaction: true,
      signAllTransactions: true
    });
    
    return true;
  };

  const handleCreateToken = async () => {
    if (!checkWalletCapabilities()) {
        setError('Please ensure your wallet is properly connected with signing capabilities');
        return;
    }

    if (!wallet.publicKey || !wallet.signTransaction) {
        setError('Wallet signing capabilities are required');
        return;
    }

    // Ensure valid input before proceeding
    if (!tokenConfig.name || !tokenConfig.symbol || tokenConfig.totalSupply <= 0) {
        setError("Please enter a valid name, symbol, and total supply for the token.");
        return;
    }

    console.log('🚀 Starting token creation with config:', tokenConfig);
    setIsLoading(true);
    setError(null);

    try {
        console.log('🔗 Using existing Solana connection');

        // Generate a new keypair for the mint
        const mintKeypair = Keypair.generate();
        console.log('📝 Mint Keypair:', mintKeypair.publicKey.toString());

        // Calculate the rent for the mint account
        const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        console.log('💰 Mint rent:', mintRent / 1e9, 'SOL');

        // Check SOL balance for fees
        const balance = await connection.getBalance(wallet.publicKey);
        console.log('💰 Current balance:', balance / 1e9, 'SOL');

        if (balance < mintRent + 5000000) {
            throw new Error(`❌ Insufficient SOL: Need at least ${(mintRent + 5000000) / 1e9} SOL, current balance: ${balance / 1e9} SOL`);
        }

        // Create transaction
        const transaction = new Transaction();

        // Add instruction to create account for the mint
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: MINT_SIZE,
                lamports: mintRent,
                programId: TOKEN_PROGRAM_ID
            })
        );

        // Add instruction to initialize the mint
        transaction.add(
            createInitializeMintInstruction(
                mintKeypair.publicKey,
                tokenConfig.decimals,
                wallet.publicKey,
                wallet.publicKey,
                TOKEN_PROGRAM_ID
            )
        );

        console.log('✅ Added mint initialization instruction');

        // Get recent blockhash and set on transaction
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey!;

        console.log('📜 Transaction has', transaction.instructions.length, 'instructions');

        // Sign with the mint keypair first
        transaction.partialSign(mintKeypair);
        console.log('✅ Signed transaction with Mint Keypair:', mintKeypair.publicKey.toString());

        // Sign with wallet
        const signedTransaction = await wallet.signTransaction!(transaction);
        console.log('✅ Signed transaction with Wallet:', wallet.publicKey.toString());

        debugTransaction(signedTransaction);

        // Send transaction
        console.log('📡 Sending transaction...');
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log('📤 Transaction sent with signature:', signature);

        // Add retry logic for confirmation
        let confirmed = false;
        let retries = 5;

        while (!confirmed && retries > 0) {
            try {
                const status = await connection.getSignatureStatus(signature);
                if (status?.value?.confirmationStatus === 'confirmed' || 
                    status?.value?.confirmationStatus === 'finalized') {
                    confirmed = true;
                    break;
                }
                
                console.log(`🔄 Waiting for confirmation... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries--;
            } catch (err) {
                console.warn('Confirmation check failed:', err);
                retries--;
            }
        }

        if (!confirmed) {
            throw new Error('Transaction confirmation timeout');
        }

        console.log('✅ Transaction confirmed!');
        console.log('✅ Token mint created successfully:', mintKeypair.publicKey.toString());

        // Wait for mint account to be confirmed
        console.log('⏳ Waiting for mint account to be confirmed...');
        let mintAccount = null;
        let mintAccountRetries = 10;

        while (!mintAccount && mintAccountRetries > 0) {
            try {
                // Add error logging
                console.log('🔍 Attempting to fetch mint account...');
                
                // Try to get the mint account with more detailed error handling
                const accountInfo = await connection.getAccountInfo(
                    mintKeypair.publicKey,
                    'finalized'
                );
                
                console.log('📝 Account info:', accountInfo);
                
                if (accountInfo === null) {
                    console.log('⚠️ Account info is null');
                    throw new Error('Account not found');
                }

                mintAccount = await getMint(
                    connection,
                    mintKeypair.publicKey,
                    'finalized'
                );
                
                console.log('✅ Mint account verified:', {
                    address: mintAccount.address.toString(),
                    mintAuthority: mintAccount.mintAuthority?.toString(),
                    freezeAuthority: mintAccount.freezeAuthority?.toString(),
                    decimals: mintAccount.decimals
                });
                
                break;
            } catch (err) {
                console.log(`⏳ Waiting for mint account (${mintAccountRetries} retries left)...`);
                console.error('Mint verification error:', err);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
                mintAccountRetries--;
            }
        }

        if (!mintAccount) {
            throw new Error('Failed to verify mint account creation');
        }

        // Create Associated Token Account for the user
        console.log('🏦 Creating token account for the user...');
        const tokenAccount = await createTokenAccount(
            connection,
            wallet,
            mintKeypair.publicKey
        );
        
        console.log('✅ Token account details:', {
            address: tokenAccount.toString(),
            mint: mintKeypair.publicKey.toString(),
            owner: wallet.publicKey.toString()
        });

        // Mint Initial Supply
        const mintAmount = BigInt(tokenConfig.totalSupply * (10 ** tokenConfig.decimals));
        console.log('💰 Minting initial supply:', mintAmount);

        await handleMintTokens(
            connection,
            wallet,
            mintKeypair,
            tokenAccount,
            mintAmount
        );

        // Save token data to backend
        const tokenData = {
            mint: mintKeypair.publicKey.toString(),
            name: tokenConfig.name,
            symbol: tokenConfig.symbol,
            decimals: tokenConfig.decimals,
            totalSupply: tokenConfig.totalSupply,
            owner: wallet.publicKey.toString(),
            features: tokenConfig.features,
            metadata: tokenConfig.metadata
        };

        console.log('💾 Saving token data:', tokenData);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(tokenData)
        });

        if (!response.ok) {
            throw new Error('Failed to save token data');
        }

        console.log('✅ Token creation complete');
        setIsLoading(false);
    } catch (error) {
        console.error('❌ Token creation failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to create token');
        setIsLoading(false);
    }
};


  const handleWalletConnect = useCallback(async (address: string) => {
    try {
      setTokenConfig(prev => ({
        ...prev,
        initialOwner: address
      }));
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError('Failed to connect wallet');
    }
  }, []);

  const testTokenCreation = async () => {
    try {
      if (!wallet.publicKey) {
        throw new Error('Wallet public key is required');
        return;
      }

      // Set test configuration
      setTokenConfig(prev => ({
        ...prev,
        ...testTokenConfig
      }));
      
      // Open confirmation modal
      setShowConfirmation(true);
      
      console.log('Test configuration set:', tokenConfig);
      console.log('Wallet connection status:', {
        connected: wallet.connected,
        publicKey: wallet.publicKey.toString()
      });
      
      // Test connection to Solana
      const balance = await connection.getBalance(wallet.publicKey);
      console.log('Wallet SOL balance:', balance / 1e9);
    
    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : 'Test failed');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Token Creator</h1>
          <p className="text-gray-400 text-sm sm:text-base">Create your own Solana token in minutes</p>
        </div>

        {/* Wallet Connection Section */}
        <div className="mb-6 sm:mb-8">
          <ConnectWallet onConnect={handleWalletConnect} />
        </div>

        {/* Token Configuration Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">Token Configuration</h3>
          
          <div className="space-y-6">
            {/* Basic Token Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token Name</label>
                <input
                  type="text"
                  value={tokenConfig.name}
                  onChange={(e) => setTokenConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Example Token"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token Symbol</label>
                <input
                  type="text"
                  value={tokenConfig.symbol}
                  onChange={(e) => setTokenConfig(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EXM"
                  maxLength={5}
                />
              </div>
            </div>

            {/* Supply and Decimals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Total Supply</label>
                <input
                  type="number"
                  value={tokenConfig.totalSupply}
                  onChange={(e) => setTokenConfig(prev => ({ ...prev, totalSupply: Number(e.target.value) }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  title="Total Supply"
                  placeholder="Enter total supply"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Decimals</label>
                <input
                  type="number"
                  value={tokenConfig.decimals}
                  onChange={(e) => setTokenConfig(prev => ({ ...prev, decimals: Number(e.target.value) }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="9"
                  title="Decimals"
                  placeholder="Enter number of decimals (0-9)"
                />
              </div>
            </div>

            {/* Token Features */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Token Features</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tokenConfig.features.mintable}
                    onChange={(e) => setTokenConfig(prev => ({
                      ...prev,
                      features: { ...prev.features, mintable: e.target.checked }
                    }))}
                    className="form-checkbox text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-300">Mintable</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tokenConfig.features.freezable}
                    onChange={(e) => setTokenConfig(prev => ({
                      ...prev,
                      features: { ...prev.features, freezable: e.target.checked }
                    }))}
                    className="form-checkbox text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-300">Freezable</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tokenConfig.features.burnable}
                    onChange={(e) => setTokenConfig(prev => ({
                      ...prev,
                      features: { ...prev.features, burnable: e.target.checked }
                    }))}
                    className="form-checkbox text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-300">Burnable</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tokenConfig.features.immutable}
                    onChange={(e) => setTokenConfig(prev => ({
                      ...prev,
                      features: { ...prev.features, immutable: e.target.checked }
                    }))}
                    className="form-checkbox text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-300">Immutable</span>
                </label>
              </div>
            </div>

            {/* Token Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={tokenConfig.metadata.description}
                onChange={(e) => setTokenConfig(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, description: e.target.value }
                }))}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe your token's purpose and features..."
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={testTokenCreation}
            disabled={!wallet.connected}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Creation
          </button>
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={!wallet.connected}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Details
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Confirm Token Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Token Name:</span>
                    <p className="text-white">{tokenConfig.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Symbol:</span>
                    <p className="text-white">{tokenConfig.symbol}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Total Supply:</span>
                    <p className="text-white">{tokenConfig.totalSupply}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Decimals:</span>
                    <p className="text-white">{tokenConfig.decimals}</p>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 text-sm">Features:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(tokenConfig.features).map(([key, value]) => (
                      value && (
                        <span key={key} className="px-2 py-1 bg-gray-700 rounded-full text-sm text-white">
                          {key}
                        </span>
                      )
                    ))}
                  </div>
                </div>

                {tokenConfig.metadata.description && (
                  <div>
                    <span className="text-gray-400 text-sm">Description:</span>
                    <p className="text-white mt-1">{tokenConfig.metadata.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleCreateToken}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Token'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};