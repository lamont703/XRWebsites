import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';
import { useNetwork } from '@/providers/NetworkProvider';
import { confirmTransaction } from '@/lib/solana/confirm';
import styles from '@/styles/TokenPresale.module.css';
import Confetti from 'react-confetti';

// Treasury wallet address - replace with your actual treasury address
const TREASURY_WALLET = new PublicKey("3rVFJZmgizAiH7aQJmtXdDQab6Uj35xesp7LkwcTPxNf");
const TOKEN_PRICE = 0.001688; // Price per token in USD
const TOKEN_SYMBOL = "$XR$";
const TOKEN_NAME = "XRBLOCKDEV";
const TOKENS_PER_SOL = 88768; // Based on SOL price and token price

// Status for transaction modal
interface StatusState {
  show: boolean;
  step: number;
  title: string;
  message: string;
  icon: string;
  progress: number;
  showClose: boolean;
}

export const TokenPresale = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { network } = useNetwork();
  
  const [solAmount, setSolAmount] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [purchasedTokens, setPurchasedTokens] = useState<number>(0);
  const [stakeableTokens, setStakeableTokens] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 180,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Transaction status modal state
  const [status, setStatus] = useState<StatusState>({
    show: false,
    step: 0,
    title: '',
    message: '',
    icon: '',
    progress: 0,
    showClose: false
  });

  // Add state for tiers
  const [currentTier, setCurrentTier] = useState(0);

  // Add state for confetti
  const [showConfetti, setShowConfetti] = useState(false);

  // Calculate time remaining until price increase
  useEffect(() => {
    // Set end date 180 days from now (or use a specific date)
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 180);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;
      
      if (distance < 0) {
        clearInterval(timer);
        return;
      }
      
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Load user's purchased tokens (in a real app, this would come from your backend)
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      // This is where you would fetch the user's token balance
      // For now, we'll use placeholder values
      setPurchasedTokens(0);
      setStakeableTokens(0);
    }
  }, [wallet.connected, wallet.publicKey]);

  const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSolAmount(value);
    }
  };

  const showStatusModal = (
    step: number, 
    title: string, 
    message: string, 
    icon: string, 
    progress: number, 
    showClose: boolean = false
  ) => {
    setStatus({
      show: true,
      step,
      title,
      message,
      icon,
      progress,
      showClose
    });
  };

  const closeStatusModal = () => {
    setStatus(prev => ({ ...prev, show: false }));
  };

  const buyTokens = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setStatusMessage('Please connect your wallet first');
      return;
    }

    const solValue = parseFloat(solAmount);
    if (isNaN(solValue) || solValue <= 0) {
      setStatusMessage('Please enter a valid SOL amount');
      return;
    }

    try {
      // Step 1: Show processing modal
      showStatusModal(1, 'Processing Transaction', 'Please approve the transaction in your wallet...', '⏳', 25);

      // Create a transaction to send SOL to treasury
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: TREASURY_WALLET,
          lamports: solValue * LAMPORTS_PER_SOL
        })
      );

      // Step 2: Sign transaction
      showStatusModal(2, 'Signing Transaction', 'Please confirm the transaction in your wallet...', '✍️', 50);
      
      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign transaction
      const signedTransaction = await wallet.signTransaction!(transaction);

      // Step 3: Send transaction
      showStatusModal(3, 'Sending Transaction', 'Broadcasting to Solana network...', '🌐', 75);
      
      // Send and confirm transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      const confirmed = await confirmTransaction(
        connection, 
        signature, 
        network === 'mainnet' ? 'mainnet-beta' : 'devnet'
      );

      if (confirmed) {
        // Show confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        
        // Step 4: Success
        showStatusModal(
          4, 
          'Transaction Successful!', 
          `You've purchased ${(solValue * TOKENS_PER_SOL).toLocaleString()} ${TOKEN_SYMBOL} tokens!`, 
          '✅', 
          100, 
          true
        );
        
        // Update user's token balance
        setPurchasedTokens(prev => prev + solValue * TOKENS_PER_SOL);
        
        // Clear input
        setSolAmount('');
        setStatusMessage(`✅ Purchase successful! Transaction: ${signature.slice(0, 8)}...`);
      } else {
        throw new Error('Transaction failed to confirm');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      showStatusModal(
        4, 
        'Transaction Failed', 
        error instanceof Error ? error.message : 'Unknown error occurred', 
        '❌', 
        100, 
        true
      );
      setStatusMessage(`❌ Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Calculate token amount based on SOL input
  const calculateTokenAmount = () => {
    const sol = parseFloat(solAmount);
    if (isNaN(sol)) return 0;
    return sol * TOKENS_PER_SOL;
  };

  return (
    <MainLayout>
      <div className={styles.presaleContainer}>
        <div className={styles.presaleHeader}>
          <h1>Token Pre-Sale</h1>
          <p>Get early access to our platform tokens at exclusive rates</p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
        </div>
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
        <div className={styles.presaleCard}>
          <h1 className={styles.presaleTitle}>🚀 {TOKEN_NAME} Token Pre-Sale</h1>
          
          <div className={styles.countdownSection}>
            <p className={styles.countdownLabel}>⏳ Until Next Price Increase</p>
            <div className={styles.countdownTimer}>
              <div className={styles.countdownItem}>
                <span className={styles.countdownValue}>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className={styles.countdownUnit}>days</span>
              </div>
              <div className={styles.countdownSeparator}>:</div>
              <div className={styles.countdownItem}>
                <span className={styles.countdownValue}>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className={styles.countdownUnit}>hours</span>
              </div>
              <div className={styles.countdownSeparator}>:</div>
              <div className={styles.countdownItem}>
                <span className={styles.countdownValue}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className={styles.countdownUnit}>mins</span>
              </div>
              <div className={styles.countdownSeparator}>:</div>
              <div className={styles.countdownItem}>
                <span className={styles.countdownValue}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className={styles.countdownUnit}>secs</span>
              </div>
            </div>
          </div>
          
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>SOL RAISED:</span>
              <span className={styles.progressValue}>$29,422,520.49 / $30,319,963</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '97%' }}></div>
            </div>
          </div>
          
          <div className={styles.tokenBalances}>
            <div className={styles.balanceItem}>
              <span className={styles.balanceLabel}>YOUR PURCHASED {TOKEN_SYMBOL}:</span>
              <span className={styles.balanceValue}>{purchasedTokens.toLocaleString()}</span>
            </div>
            <div className={styles.balanceItem}>
              <span className={styles.balanceLabel}>YOUR STAKEABLE {TOKEN_SYMBOL}:</span>
              <span className={styles.balanceValue}>{stakeableTokens.toLocaleString()}</span>
            </div>
          </div>
          
          <div className={styles.tierSection}>
            <h3 className={styles.tierTitle}>Purchase Tiers</h3>
            <div className={styles.tiers}>
              <div 
                className={`${styles.tier} ${currentTier === 0 ? styles.activeTier : ''}`}
                onClick={() => {setSolAmount('0.5'); setCurrentTier(0);}}
              >
                <div className={styles.tierHeader}>Basic</div>
                <div className={styles.tierAmount}>0.1-1 SOL</div>
                <div className={styles.tierBenefit}>Standard allocation</div>
              </div>
              <div 
                className={`${styles.tier} ${currentTier === 1 ? styles.activeTier : ''}`}
                onClick={() => {setSolAmount('3'); setCurrentTier(1);}}
              >
                <div className={styles.tierHeader}>Premium</div>
                <div className={styles.tierAmount}>1-5 SOL</div>
                <div className={styles.tierBenefit}>+5% bonus tokens</div>
              </div>
              <div 
                className={`${styles.tier} ${currentTier === 2 ? styles.activeTier : ''}`}
                onClick={() => {setSolAmount('10'); setCurrentTier(2);}}
              >
                <div className={styles.tierHeader}>Whale</div>
                <div className={styles.tierAmount}>5+ SOL</div>
                <div className={styles.tierBenefit}>+10% bonus + NFT</div>
              </div>
            </div>
          </div>
          
          <div className={styles.conversionRate}>
            <p>1 SOL = {TOKENS_PER_SOL.toLocaleString()} {TOKEN_SYMBOL}</p>
            <p className={styles.tokenPrice}>(based on ${TOKEN_PRICE} per token)</p>
          </div>
          
          <div className={styles.tokenBranding}>
            <div className={styles.tokenLogo}>$XR$</div>
            <div className={styles.tokenDetails}>
              <h2>{TOKEN_NAME}</h2>
              <p>The future of blockchain development</p>
            </div>
          </div>
          
          <div className={styles.purchaseSection}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                className={styles.solInput}
                placeholder="Enter amount in SOL"
                value={solAmount}
                onChange={handleSolAmountChange}
              />
              <div className={styles.tokenPreview}>
                ≈ {calculateTokenAmount().toLocaleString()} {TOKEN_SYMBOL}
              </div>
            </div>
            
            <button 
              className={styles.buyButton}
              onClick={buyTokens}
              disabled={!wallet.connected}
            >
              Buy {TOKEN_SYMBOL}
            </button>
            
            {statusMessage && (
              <p className={styles.statusMessage}>{statusMessage}</p>
            )}
          </div>
          
          {!wallet.connected ? (
            <div className={styles.walletSection}>
              <ConnectWallet />
              <div className={styles.walletHelp}>
                <p>Don't have a wallet?</p>
                <a 
                  href="https://phantom.app/download" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.walletLink}
                >
                  Get Phantom Wallet
                </a>
              </div>
            </div>
          ) : (
            <div className={styles.walletInfo}>
              <p>Connected: {wallet.publicKey.toString().slice(0, 6)}...{wallet.publicKey.toString().slice(-4)}</p>
            </div>
          )}
          
          <div className={styles.trustSection}>
            <a href="#" className={styles.trustLink}>✅ Trust & Safety Audits</a>
            <div className={styles.socialLinks}>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>🔗 LinkedIn</a>
              <span className={styles.socialSeparator}>|</span>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>TikTok</a>
            </div>
          </div>
          
          <div className={styles.faqSection}>
            <h3>Frequently Asked Questions</h3>
            <div className={styles.faqItem}>
              <h4>When will tokens be distributed?</h4>
              <p>Tokens will be distributed immediately after purchase to your connected wallet.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Is there a minimum purchase?</h4>
              <p>Yes, the minimum purchase amount is 0.1 SOL.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transaction Status Modal */}
      {status.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>{status.icon}</div>
            <h3 className={styles.modalTitle}>{status.title}</h3>
            <p className={styles.modalMessage}>{status.message}</p>
            
            <div className={styles.modalProgress}>
              <div className={styles.modalProgressHeader}>
                <span>Progress</span>
                <span>Step {status.step}/4</span>
              </div>
              <div className={styles.modalProgressBar}>
                <div 
                  className={styles.modalProgressFill} 
                  style={{ width: `${status.progress}%` }}
                ></div>
              </div>
            </div>
            
            {status.showClose && (
              <button 
                className={styles.modalCloseButton}
                onClick={closeStatusModal}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}; 