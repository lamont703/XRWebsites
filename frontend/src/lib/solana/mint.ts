import { 
  Connection, 
  PublicKey, 
  Transaction,
  Keypair,
  SystemProgram,
  TransactionInstruction,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { 
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  mintTo,
  getMint,
  createMintToInstruction
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { confirmTransaction } from './confirm';
import { TokenConfig } from '@/types/token';

export async function createTokenMint(
  connection: Connection,
  wallet: WalletContextState,
  tokenConfig: TokenConfig,
  network: 'devnet' | 'mainnet-beta' = 'devnet'
) {
  try {
    const mintKeypair = Keypair.generate();
    
    // Get minimum lamports for rent exemption
    const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    console.log('Rent exemption cost:', lamports / 1e9, 'SOL');

    // Create instructions for mint account
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey!,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID
    });

    const initializeMintInstruction = createInitializeMintInstruction(
      mintKeypair.publicKey,
      tokenConfig.decimals,
      wallet.publicKey!,
      wallet.publicKey!,
      TOKEN_PROGRAM_ID
    );

    // Add compute budget instruction to prevent simulation failures
    const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
      units: 400000 // Increased compute units
    });

    // Create transaction and add instructions
    const transaction = new Transaction()
      .add(computeBudgetInstruction)
      .add(createAccountInstruction)
      .add(initializeMintInstruction);

    // Set fee payer and recent blockhash
    transaction.feePayer = wallet.publicKey!;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;

    // Simulate transaction with detailed logs
    console.log('Simulating mint account creation...');
    const simulation = await connection.simulateTransaction(transaction);
    
    if (simulation.value.err) {
      console.error('Mint account creation simulation failed:', simulation.value.err);
      console.error('Simulation logs:', simulation.value.logs);
      throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    // Verify simulation logs for any warnings or potential issues
    const logs = simulation.value.logs || [];
    const hasErrors = logs.some(log => 
      log.toLowerCase().includes('error') || 
      log.toLowerCase().includes('failed') ||
      log.toLowerCase().includes('insufficient')
    );

    if (hasErrors) {
      console.error('Simulation showed potential issues:', logs);
      throw new Error('Transaction simulation showed potential issues');
    }

    console.log('Simulation successful, logs:', logs);
    console.log('Compute units used:', simulation.value.unitsConsumed);

    // Sign with mint keypair first
    transaction.partialSign(mintKeypair);
    
    // Then get wallet signature
    if (!wallet.signTransaction) {
      throw new Error('Wallet does not support signing');
    }
    
    const signedTx = await wallet.signTransaction(transaction);
    
    // Verify all signatures are present
    const signers = [wallet.publicKey!, mintKeypair.publicKey];
    const missingSignatures = signedTx.signatures
      .filter(sig => signers.some(signer => sig.publicKey.equals(signer)))
      .filter(sig => !sig.signature);
      
    if (missingSignatures.length > 0) {
      const missing = missingSignatures.map(sig => sig.publicKey.toString()).join(', ');
      throw new Error(`Transaction is missing signatures from: ${missing}`);
    }

    // Send and confirm
    console.log('Sending mint account creation transaction...');
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3
    });
    
    console.log('Confirming mint account creation...');
    const confirmed = await confirmTransaction(connection, signature, network);
    if (!confirmed) {
      throw new Error('Failed to confirm mint account creation');
    }

    // Verify mint account
    try {
      const mintAccount = await getMint(connection, mintKeypair.publicKey);
      
      // Verify the mint account is properly initialized
      if (!mintAccount.isInitialized) {
        throw new Error('Mint account was created but not initialized');
      }

      if (!mintAccount.mintAuthority?.equals(wallet.publicKey!)) {
        throw new Error('Mint account has incorrect mint authority');
      }

      // Log the token details with the actual values from tokenConfig
      console.log('Token created successfully:', {
        address: mintKeypair.publicKey.toString(),
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        decimals: tokenConfig.decimals,
        mintAuthority: mintAccount.mintAuthority?.toString(),
        freezeAuthority: mintAccount.freezeAuthority?.toString() || null,
        isInitialized: mintAccount.isInitialized,
        supply: mintAccount.supply.toString()
      });

      return { mintKeypair, mintAccount };
    } catch (error) {
      console.error('Failed to verify mint account:', error);
      
      // Check if the account exists but isn't initialized properly
      const accountInfo = await connection.getAccountInfo(mintKeypair.publicKey);
      if (!accountInfo) {
        throw new Error('Mint account was not created');
      } else {
        console.log('Account exists but may not be initialized:', {
          owner: accountInfo.owner.toString(),
          lamports: accountInfo.lamports,
          space: accountInfo.data.length,
          executable: accountInfo.executable
        });
        throw new Error('Failed to verify mint account initialization');
      }
    }
  } catch (error) {
    console.error('Token mint creation failed:', error);
    throw error;
  }
}

export async function mintTokens(
  connection: Connection,
  wallet: WalletContextState,
  mintKeypair: Keypair,
  destinationAccount: PublicKey,
  amount: bigint
) {
  try {
    // Verify the mint authority matches the wallet
    const mintInfo = await getMint(connection, mintKeypair.publicKey);
    if (!mintInfo.mintAuthority?.equals(wallet.publicKey!)) {
      throw new Error('Wallet is not the mint authority');
    }

    const transaction = new Transaction().add(
      createMintToInstruction(
        mintKeypair.publicKey,
        destinationAccount,
        wallet.publicKey!,
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Set fee payer and recent blockhash
    transaction.feePayer = wallet.publicKey!;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Simulate the transaction first
    console.log('Simulating mint transaction...');
    const simulation = await connection.simulateTransaction(transaction);
    
    if (simulation.value.err) {
      console.error('Transaction simulation failed:', simulation.value.err);
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    console.log('Transaction simulation successful');

    // Only need wallet signature since wallet is mint authority
    const signedTx = await wallet.signTransaction!(transaction);
    
    // Send and confirm transaction
    console.log('Sending mint transaction...');
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    console.log('Confirming mint transaction...');
    const confirmed = await confirmTransaction(connection, signature);
    if (!confirmed) {
      throw new Error('Failed to confirm mint transaction');
    }

    console.log('Mint transaction confirmed');
    return signature;
  } catch (error) {
    console.error('Mint tokens failed:', error);
    throw error;
  }
}
