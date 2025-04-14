import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import styles from '@/styles/ConnectWallet.module.css';

interface ConnectWalletProps {
  onConnect?: (address: string) => Promise<void>;
  referralCode?: string;
  className?: string;
  compact?: boolean;
}

export const ConnectWallet = ({ 
  onConnect, 
  referralCode, 
  className,
  compact = false
}: ConnectWalletProps) => {
  const wallet = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [hasTriggeredConnect, setHasTriggeredConnect] = useState(false);

  useEffect(() => {
    const handleWalletConnection = async () => {
      if (wallet.connected && wallet.publicKey && onConnect && !hasTriggeredConnect) {
        setIsLinking(true);
        setHasTriggeredConnect(true);
        try {
          await onConnect(wallet.publicKey.toString());
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to link wallet');
        } finally {
          setIsLinking(false);
        }
      }
    };

    handleWalletConnection();
  }, [wallet.connected, wallet.publicKey, onConnect, hasTriggeredConnect]);

  const containerClass = compact 
    ? `${styles.container} ${styles.compact} ${className || ''}` 
    : `${styles.container} ${className || ''}`;

  return (
    <div className={containerClass}>
      {!compact && <h3 className={styles.title}>Connect Wallet</h3>}
      <div className={styles.content}>
        {isLinking ? (
          <div className={styles.linking}>
            <div className={styles.spinner}></div>
            <span>Connecting your wallet...</span>
          </div>
        ) : (
          <>
            {!compact && (
              <p className={styles.walletInfo}>
                {wallet.connected 
                  ? `Connected: ${wallet.publicKey?.toString().slice(0, 6)}...${wallet.publicKey?.toString().slice(-4)}`
                  : 'Connect your Solana wallet to continue'}
              </p>
            )}
            <div className={styles.buttonContainer}>
              <WalletMultiButton className={styles.walletButton} />
            </div>
          </>
        )}
      </div>
      {error && (
        <div className={styles.error}>{error}</div>
      )}
    </div>
  );
}; 