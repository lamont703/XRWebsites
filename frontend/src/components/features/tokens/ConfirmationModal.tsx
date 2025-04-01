import { TokenConfig } from '@/types/token';
import styles from '@/styles/ConfirmationModal.module.css';

interface ConfirmationModalProps {
  tokenConfig: TokenConfig;
  isLoading: boolean;
  currentStep?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = ({
  tokenConfig,
  isLoading,
  currentStep,
  onConfirm,
  onCancel
}: ConfirmationModalProps) => {
  const steps = [
    'Creating token mint',
    'Creating Associated Token Account',
    'Minting initial supply',
    'Saving token information'
  ];

  const getCurrentStepIndex = () => {
    if (!currentStep) return -1;
    return steps.findIndex(step => 
      currentStep.toLowerCase().includes(step.toLowerCase())
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>
          {isLoading ? 'Creating Token...' : 'Confirm Token Creation'}
        </h2>
        
        <div className={styles.content}>
          {!isLoading ? (
            <>
              <p>Please confirm the following token details:</p>
              
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
                  <span>Decimals:</span>
                  <span>{tokenConfig.decimals}</span>
                </div>
                <div className={styles.row}>
                  <span>Total Supply:</span>
                  <span>{tokenConfig.totalSupply.toLocaleString()}</span>
                </div>
                <div className={styles.row}>
                  <span>Features:</span>
                  <span>
                    {Object.entries(tokenConfig.features)
                      .filter(([_, enabled]) => enabled)
                      .map(([feature]) => feature)
                      .join(', ')}
                  </span>
                </div>
              </div>

              <div className={styles.estimatedCost}>
                <h4>Estimated Cost</h4>
                <div className={styles.row}>
                  <span>Transaction Fees:</span>
                  <span>~0.01 SOL</span>
                </div>
                <div className={styles.row}>
                  <span>Account Rent:</span>
                  <span>~0.00350088 SOL</span>
                </div>
              </div>

              <div className={styles.warning}>
                <p>⚠️ This action cannot be undone. Please verify all details carefully.</p>
              </div>
            </>
          ) : (
            <div className={styles.progress}>
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`${styles.step} ${
                    index <= getCurrentStepIndex() ? styles.active : ''
                  } ${index === getCurrentStepIndex() ? styles.current : ''}`}
                >
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <div className={styles.stepText}>{step}</div>
                </div>
              ))}
              {currentStep && (
                <div className={styles.currentStep}>
                  {currentStep}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.buttons}>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className={styles.confirmButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                Creating...
              </div>
            ) : (
              'Create Token'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 