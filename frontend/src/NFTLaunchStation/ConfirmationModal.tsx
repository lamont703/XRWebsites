import styles from '@/styles/NFTLaunchStation.module.css';
import { NFTConfig } from '@/types/nft';

interface ConfirmationModalProps {
  nftConfig: NFTConfig;
  isLoading: boolean;
  currentStep: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = ({
  nftConfig,
  isLoading,
  currentStep,
  onConfirm,
  onCancel
}: ConfirmationModalProps) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Confirm NFT Launch</h2>
          {!isLoading && (
            <button 
              className={styles.closeButton}
              onClick={onCancel}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className={styles.modalContent}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <div className={styles.loadingStep}>{currentStep}</div>
            </div>
          ) : (
            <>
              <div className={styles.confirmationDetails}>
                <div className={styles.confirmationItem}>
                  <span className={styles.confirmationLabel}>Name:</span>
                  <span className={styles.confirmationValue}>{nftConfig.name}</span>
                </div>
                <div className={styles.confirmationItem}>
                  <span className={styles.confirmationLabel}>Description:</span>
                  <span className={styles.confirmationValue}>{nftConfig.description}</span>
                </div>
                <div className={styles.confirmationItem}>
                  <span className={styles.confirmationLabel}>Supply:</span>
                  <span className={styles.confirmationValue}>{nftConfig.supply}</span>
                </div>
                <div className={styles.confirmationItem}>
                  <span className={styles.confirmationLabel}>Royalties:</span>
                  <span className={styles.confirmationValue}>{nftConfig.royalties}%</span>
                </div>
                {nftConfig.attributes.length > 0 && (
                  <div className={styles.confirmationItem}>
                    <span className={styles.confirmationLabel}>Attributes:</span>
                    <span className={styles.confirmationValue}>
                      {nftConfig.attributes.filter(attr => attr.trait_type && attr.value).length} attributes
                    </span>
                  </div>
                )}
              </div>
              
              <div className={styles.confirmationWarning}>
                <p>
                  <strong>Important:</strong> This action will mint your NFT on the Solana blockchain. 
                  This operation requires a small amount of SOL for transaction fees and cannot be undone.
                </p>
              </div>
            </>
          )}
        </div>
        
        {!isLoading && (
          <div className={styles.modalActions}>
            <button 
              className={styles.cancelButton}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className={styles.confirmButton}
              onClick={onConfirm}
            >
              Launch NFT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 