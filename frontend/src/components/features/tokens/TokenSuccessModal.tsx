import { TokenConfig } from '@/types/token';
import styles from '@/styles/ConfirmationModal.module.css';

interface TokenSuccessModalProps {
  tokenConfig: TokenConfig;
  mintAddress: string;
  onViewExplorer: () => void;
  onCreateAnother: () => void;
  onViewDashboard: () => void;
}

export const TokenSuccessModal = ({
  tokenConfig,
  mintAddress,
  onViewExplorer,
  onCreateAnother,
  onViewDashboard
}: TokenSuccessModalProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.successHeader}>
          <div className={styles.successIcon}>✨</div>
          <h2 className={styles.title}>Token Created Successfully!</h2>
        </div>
        
        <div className={styles.content}>
          <div className={styles.details}>
            <div className={styles.row}>
              <span>Name:</span>
              <span>{tokenConfig.name}</span>
            </div>
            <div className={styles.row}>
              <span>Symbol:</span>
              <span>{tokenConfig.symbol}</span>
            </div>
            <div className={styles.row}>
              <span>Mint Address:</span>
              <span className={styles.address}>{mintAddress}</span>
            </div>
            <div className={styles.row}>
              <span>Total Supply:</span>
              <span>{tokenConfig.totalSupply.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.successActions}>
            <button 
              onClick={onViewExplorer}
              className={styles.primaryButton}
            >
              View on Solana Explorer
            </button>
            <div className={styles.secondaryActions}>
              <button 
                onClick={onCreateAnother}
                className={styles.secondaryButton}
              >
                Create Another Token
              </button>
              <button 
                onClick={onViewDashboard}
                className={styles.secondaryButton}
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 