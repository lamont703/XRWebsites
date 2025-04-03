import { 
  Connection, 
  PublicKey, 
  Transaction,
  TransactionInstruction,
  SystemProgram,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { confirmTransaction } from './confirm';

export async function createAssociatedTokenAccount(
  connection: Connection,
  wallet: WalletContextState,
  mintPubkey: PublicKey,
  network: 'devnet' | 'mainnet-beta' = 'devnet'
) {
  try {
    // Get the ATA address first
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintPubkey,
      wallet.publicKey!,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log('Derived ATA address:', associatedTokenAddress.toString());

    // Check if account already exists
    const account = await connection.getAccountInfo(associatedTokenAddress);
    if (account !== null) {
      // Verify the existing account is properly initialized
      try {
        const tokenAccount = await getAccount(connection, associatedTokenAddress);
        if (tokenAccount.mint.equals(mintPubkey) && tokenAccount.owner.equals(wallet.publicKey!)) {
          console.log('ATA already exists and is properly initialized');
          return associatedTokenAddress;
        }
      } catch (error) {
        console.warn('Existing account is not properly initialized:', error);
      }
    }

    // Add compute budget instruction to prevent simulation failures
    const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
      units: 400000 // Increased compute units
    });

    // Create the ATA instruction
    const createAtaInstruction = createAssociatedTokenAccountInstruction(
      wallet.publicKey!,
      associatedTokenAddress,
      wallet.publicKey!,
      mintPubkey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Create transaction and add instructions
    const transaction = new Transaction()
      .add(computeBudgetInstruction)
      .add(createAtaInstruction);

    // Set fee payer and recent blockhash
    transaction.feePayer = wallet.publicKey!;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;

    // Simulate the transaction first with detailed logs
    console.log('Simulating ATA creation...');
    const simulation = await connection.simulateTransaction(transaction);
    
    if (simulation.value.err) {
      console.error('ATA creation simulation failed:', simulation.value.err);
      console.error('Simulation logs:', simulation.value.logs);
      throw new Error(`ATA creation simulation failed: ${JSON.stringify(simulation.value.err)}`);
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

    console.log('ATA creation simulation successful');
    console.log('Simulation logs:', logs);
    console.log('Units consumed:', simulation.value.unitsConsumed);

    // Get wallet signature
    if (!wallet.signTransaction) {
      throw new Error('Wallet does not support signing');
    }
    
    const signedTx = await wallet.signTransaction(transaction);
    
    // Verify signature is present
    const missingSignatures = signedTx.signatures
      .filter(sig => sig.publicKey.equals(wallet.publicKey!))
      .filter(sig => !sig.signature);
      
    if (missingSignatures.length > 0) {
      throw new Error('Transaction is missing required wallet signature');
    }

    // Send and confirm transaction with higher commitment
    console.log('Sending ATA creation transaction...');
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3
    });
    
    console.log('Confirming ATA creation...');
    const confirmed = await confirmTransaction(connection, signature, network);
    if (!confirmed) {
      throw new Error('Failed to confirm ATA creation');
    }

    // Verify the account was created and properly initialized
    try {
      const tokenAccount = await getAccount(connection, associatedTokenAddress);
      
      // Verify account properties
      if (!tokenAccount.mint.equals(mintPubkey)) {
        throw new Error('Created ATA has incorrect mint');
      }
      if (!tokenAccount.owner.equals(wallet.publicKey!)) {
        throw new Error('Created ATA has incorrect owner');
      }

      console.log('ATA creation verified:', {
        address: associatedTokenAddress.toString(),
        mint: tokenAccount.mint.toString(),
        owner: tokenAccount.owner.toString(),
        amount: tokenAccount.amount.toString()
      });

      return associatedTokenAddress;
    } catch (error) {
      console.error('Failed to verify ATA:', error);
      
      // Check if the account exists but isn't initialized
      const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
      if (!accountInfo) {
        throw new Error('ATA was not created');
      } else {
        console.log('Account exists but may not be initialized:', {
          owner: accountInfo.owner.toString(),
          lamports: accountInfo.lamports,
          space: accountInfo.data.length,
          executable: accountInfo.executable
        });
        throw new Error('Failed to verify ATA initialization');
      }
    }
  } catch (error) {
    console.error('Create ATA failed:', error);
    throw error;
  }
}
