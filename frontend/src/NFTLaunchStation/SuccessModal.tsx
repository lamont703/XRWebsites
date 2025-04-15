import styles from '@/styles/NFTLaunchStation.module.css';
import { NFTConfig } from '@/types/nft';

interface SuccessModalProps {
  nftConfig: NFTConfig;
  mintAddress: string;
  onViewExplorer: () => void;
  onCreateAnother: () => void;
  onViewGallery: () => void;
}

export const SuccessModal = ({
  nftConfig,
  mintAddress,
  onViewExplorer,
  onCreateAnother,
  onViewGallery
}: SuccessModalProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>NFT Launch Successful! 🚀</h2>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.successAnimation}>
            <div className={styles.successIcon}>✓</div>
          </div>
          
          <h3 className={styles.successTitle}>
            Congratulations! Your NFT has been successfully launched.
          </h3>
          
          <div className={styles.terminalOutput}>
            <div className={styles.terminalHeader}>
              <span>Launch Telemetry</span>
              <button 
                className={styles.terminalCopy} 
                onClick={() => copyToClipboard(mintAddress)}
              >
                Copy Address
              </button>
            </div>
            <div className={styles.terminalContent}>
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>$</span> NFT deployed successfully
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>$</span> Mint Address: {mintAddress}
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>$</span> Name: {nftConfig.name}
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>$</span> Supply: {nftConfig.supply} editions
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.secondaryButton}
            onClick={onCreateAnother}
          >
            Create Another NFT
          </button>
          <button 
            className={styles.primaryButton}
            onClick={onViewGallery}
          >
            View My NFTs
          </button>
          <button 
            className={styles.outlineButton}
            onClick={onViewExplorer}
          >
            View on Explorer
          </button>
        </div>
      </div>
    </div>
  );
}; 