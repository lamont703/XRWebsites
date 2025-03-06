import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import styles from '@/styles/ConnectWallet.module.css';

interface ConnectWalletProps {
  onConnect?: (address: string) => Promise<void>;
}

export const ConnectWallet = ({ onConnect }: ConnectWalletProps) => {
  const wallet = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [hasConnected, setHasConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    const connectWallet = async () => {
      if (wallet.connected && wallet.publicKey && onConnect && !hasConnected) {
        try {
          await onConnect(wallet.publicKey.toString());
          if (mounted) {
            setHasConnected(true);
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err.message : 'Failed to connect wallet');
          }
        }
      }
    };

    connectWallet();

    return () => {
      mounted = false;
    };
  }, [wallet.connected, wallet.publicKey, onConnect, hasConnected]);

  // Reset hasConnected when wallet disconnects
  useEffect(() => {
    if (!wallet.connected) {
      setHasConnected(false);
    }
  }, [wallet.connected]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Connect Wallet</h3>
      <div className={styles.content}>
        <p className={styles.walletInfo}>
          {wallet.connected 
            ? `Connected: ${wallet.publicKey?.toString().slice(0, 6)}...${wallet.publicKey?.toString().slice(-4)}`
            : 'Connect your Solana wallet to continue'}
        </p>
        <div className={styles.buttonContainer}>
          <WalletMultiButton className={styles.walletButton} />
        </div>
      </div>
      {error && (
        <div className={styles.error}>{error}</div>
      )}
    </div>
  );
}; 