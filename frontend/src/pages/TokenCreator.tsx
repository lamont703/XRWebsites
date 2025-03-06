import { useState } from 'react';
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
import styles from '@/styles/TokenCreator.module.css';

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

  const handleWalletConnect = async (address: string) => {
    console.log('Wallet connected:', address);
    // Add any additional wallet connection logic here
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.connectWalletContainer}>
          <h1 className={styles.title}>Create Your Token</h1>
          <p className={styles.subtitle}>Connect your wallet to start creating your token</p>
          <ConnectWallet onConnect={handleWalletConnect} />
        </div>

        {wallet.connected && (
          <div className={styles.formContainer}>
            <div className={styles.card}>
              <div className={styles.formGrid}>
                {/* Token Name and Symbol */}
                <div>
                  <label className={styles.label}>Token Name</label>
                  <input
                    type="text"
                    value={tokenConfig.name}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, name: e.target.value }))}
                    className={styles.input}
                    placeholder="Example Token"
                  />
                </div>
                
                <div>
                  <label className={styles.label}>Token Symbol</label>
                  <input
                    type="text"
                    value={tokenConfig.symbol}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    className={styles.input}
                    placeholder="EXM"
                    maxLength={5}
                  />
                </div>

                {/* Supply and Decimals */}
                <div>
                  <label className={styles.label}>Total Supply</label>
                  <input
                    type="number"
                    value={tokenConfig.totalSupply}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, totalSupply: Number(e.target.value) }))}
                    className={styles.input}
                    min="0"
                    placeholder="Enter total supply"
                  />
                </div>
                
                <div>
                  <label className={styles.label}>Decimals</label>
                  <input
                    type="number"
                    value={tokenConfig.decimals}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, decimals: Number(e.target.value) }))}
                    className={styles.input}
                    min="0"
                    max="9"
                    placeholder="Enter number of decimals (0-9)"
                  />
                </div>

                {/* Token Features */}
                <div className={styles.checkboxGroup}>
                  {Object.entries(tokenConfig.features).map(([key, value]) => (
                    <label key={key} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setTokenConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, [key]: e.target.checked }
                        }))}
                        className={styles.checkbox}
                      />
                      <span>{key}</span>
                    </label>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <label className={styles.label}>Description</label>
                  <textarea
                    value={tokenConfig.metadata.description}
                    onChange={(e) => setTokenConfig(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, description: e.target.value }
                    }))}
                    className={styles.textarea}
                    rows={4}
                    placeholder="Describe your token's purpose and features..."
                  />
                </div>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.buttonContainer}>
              <button
                onClick={testTokenCreation}
                disabled={!wallet.connected}
                className={styles.secondaryButton}
              >
                Test Token
              </button>
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={!wallet.connected}
                className={styles.primaryButton}
              >
                Create Token
              </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
              <div className={styles.modal}>
                <div className={styles.modalContent}>
                  <h3 className={styles.modalTitle}>Confirm Token Details</h3>
                  
                  <div className={styles.confirmationGrid}>
                    <div>
                      <span className={styles.confirmationLabel}>Token Name:</span>
                      <p className={styles.confirmationValue}>{tokenConfig.name}</p>
                    </div>
                    <div>
                      <span className={styles.confirmationLabel}>Symbol:</span>
                      <p className={styles.confirmationValue}>{tokenConfig.symbol}</p>
                    </div>
                    <div>
                      <span className={styles.confirmationLabel}>Total Supply:</span>
                      <p className={styles.confirmationValue}>{tokenConfig.totalSupply}</p>
                    </div>
                    <div>
                      <span className={styles.confirmationLabel}>Decimals:</span>
                      <p className={styles.confirmationValue}>{tokenConfig.decimals}</p>
                    </div>
                  </div>

                  <div>
                    <span className={styles.confirmationLabel}>Features:</span>
                    <div>
                      {Object.entries(tokenConfig.features).map(([key, value]) => (
                        value && (
                          <span key={key} className={styles.featureTag}>
                            {key}
                          </span>
                        )
                      ))}
                    </div>
                  </div>

                  {tokenConfig.metadata.description && (
                    <div>
                      <span className={styles.confirmationLabel}>Description:</span>
                      <p className={styles.confirmationValue}>{tokenConfig.metadata.description}</p>
                    </div>
                  )}

                  <div className={styles.buttonContainer}>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className={styles.secondaryButton}
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={handleCreateToken}
                      disabled={isLoading}
                      className={styles.primaryButton}
                    >
                      {isLoading ? 'Creating...' : 'Create Token'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};