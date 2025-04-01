import { TokenConfig } from '@/types/token';
import styles from '@/styles/TokenCreator.module.css';
import { useState, useEffect } from 'react';

interface TokenFormProps {
  tokenConfig: TokenConfig;
  onChange: (config: TokenConfig) => void;
  onSubmit: () => void;
  isWalletConnected: boolean;
  error?: string | null;
}

interface ValidationErrors {
  name?: string;
  symbol?: string;
  decimals?: string;
  totalSupply?: string;
}

export const TokenForm = ({
  tokenConfig,
  onChange,
  onSubmit,
  isWalletConnected,
  error
}: TokenFormProps) => {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form on any change
  useEffect(() => {
    const errors: ValidationErrors = {};
    
    // Name validation
    if (!tokenConfig.name) {
      errors.name = 'Token name is required';
    } else if (tokenConfig.name.length < 3) {
      errors.name = 'Token name must be at least 3 characters';
    } else if (tokenConfig.name.length > 32) {
      errors.name = 'Token name must be less than 32 characters';
    }

    // Symbol validation
    if (!tokenConfig.symbol) {
      errors.symbol = 'Token symbol is required';
    } else if (tokenConfig.symbol.length < 2) {
      errors.symbol = 'Symbol must be at least 2 characters';
    } else if (tokenConfig.symbol.length > 5) {
      errors.symbol = 'Symbol must be less than 5 characters';
    }

    // Decimals validation
    if (tokenConfig.decimals < 0 || tokenConfig.decimals > 9) {
      errors.decimals = 'Decimals must be between 0 and 9';
    }

    // Total supply validation
    if (tokenConfig.totalSupply <= 0) {
      errors.totalSupply = 'Total supply must be greater than 0';
    } else if (tokenConfig.totalSupply > Number.MAX_SAFE_INTEGER) {
      errors.totalSupply = 'Total supply is too large';
    }

    setValidationErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  }, [tokenConfig]);

  return (
    <div className={styles.formContainer}>
      <div className={styles.card}>
        <div className={styles.formGrid}>
          <div>
            <label className={styles.label}>Token Name</label>
            <input
              type="text"
              value={tokenConfig.name}
              onChange={(e) => onChange({ ...tokenConfig, name: e.target.value })}
              className={`${styles.input} ${validationErrors.name ? styles.inputError : ''}`}
              placeholder="Example Token"
            />
            {validationErrors.name && (
              <span className={styles.errorText}>{validationErrors.name}</span>
            )}
          </div>
          
          <div>
            <label className={styles.label}>Token Symbol</label>
            <input
              type="text"
              value={tokenConfig.symbol}
              onChange={(e) => onChange({ ...tokenConfig, symbol: e.target.value.toUpperCase() })}
              className={`${styles.input} ${validationErrors.symbol ? styles.inputError : ''}`}
              placeholder="EXM"
              maxLength={5}
            />
            {validationErrors.symbol && (
              <span className={styles.errorText}>{validationErrors.symbol}</span>
            )}
          </div>

          <div>
            <label className={styles.label}>
              Decimals
              <span className={styles.tooltip} title="Number of decimal places for your token (e.g., 9 decimals means 1 token = 1,000,000,000 base units)">ℹ️</span>
            </label>
            <input
              type="number"
              value={tokenConfig.decimals}
              onChange={(e) => onChange({ ...tokenConfig, decimals: Number(e.target.value) })}
              className={`${styles.input} ${validationErrors.decimals ? styles.inputError : ''}`}
              min="0"
              max="9"
              placeholder="9"
            />
            {validationErrors.decimals && (
              <span className={styles.errorText}>{validationErrors.decimals}</span>
            )}
          </div>

          <div>
            <label className={styles.label}>
              Total Supply
              <span className={styles.tooltip} title="The initial amount of tokens to create">ℹ️</span>
            </label>
            <input
              type="number"
              value={tokenConfig.totalSupply}
              onChange={(e) => onChange({ ...tokenConfig, totalSupply: Number(e.target.value) })}
              className={`${styles.input} ${validationErrors.totalSupply ? styles.inputError : ''}`}
              min="0"
              placeholder="1000000"
            />
            {validationErrors.totalSupply && (
              <span className={styles.errorText}>{validationErrors.totalSupply}</span>
            )}
          </div>
        </div>

        <div className={styles.features}>
          <h3>Token Features</h3>
          <div className={styles.featureGrid}>
            {Object.entries(tokenConfig.features).map(([key, value]) => (
              <label key={key} className={styles.featureLabel}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange({
                    ...tokenConfig,
                    features: { ...tokenConfig.features, [key]: e.target.checked }
                  })}
                  className={styles.checkbox}
                />
                <span>{key}</span>
                <span className={styles.tooltip} title={getFeatureDescription(key)}>ℹ️</span>
              </label>
            ))}
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.buttonContainer}>
          <button
            onClick={onSubmit}
            disabled={!isWalletConnected || !isFormValid}
            className={styles.primaryButton}
          >
            Create Token
          </button>
        </div>
      </div>
    </div>
  );
};

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    burnable: 'Allows token holders to burn (destroy) their tokens',
    mintable: 'Allows the authority to mint additional tokens after creation',
    transferable: 'Allows tokens to be transferred between accounts',
    pausable: 'Allows the authority to pause all token transfers'
  };
  return descriptions[feature] || feature;
} 