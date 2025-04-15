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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <div className={styles.labelContainer}>
            <label className={styles.label}>
              Token Name
            </label>
            <span className={styles.tooltip} title="The full name of your token (e.g., 'Solana')">ℹ️</span>
          </div>
          <input
            type="text"
            value={tokenConfig.name}
            onChange={(e) => onChange({ ...tokenConfig, name: e.target.value })}
            placeholder="Enter token name"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formField}>
          <div className={styles.labelContainer}>
            <label className={styles.label}>
              Token Symbol
            </label>
            <span className={styles.tooltip} title="The ticker symbol for your token (e.g., 'SOL')">ℹ️</span>
          </div>
          <input
            type="text"
            value={tokenConfig.symbol}
            onChange={(e) => onChange({ ...tokenConfig, symbol: e.target.value.toUpperCase() })}
            placeholder="Enter token symbol"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formField}>
          <div className={styles.labelContainer}>
            <label className={styles.label}>
              Decimals
            </label>
            <span className={styles.tooltip} title="Number of decimal places for your token (e.g., 9 decimals means 1 token = 1,000,000,000 base units)">ℹ️</span>
          </div>
          <input
            type="number"
            value={tokenConfig.decimals}
            onChange={(e) => onChange({ ...tokenConfig, decimals: parseInt(e.target.value) })}
            min="0"
            max="9"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formField}>
          <div className={styles.labelContainer}>
            <label className={styles.label}>
              Total Supply
            </label>
            <span className={styles.tooltip} title="The total number of tokens that will be created">ℹ️</span>
          </div>
          <input
            type="number"
            value={tokenConfig.totalSupply}
            onChange={(e) => onChange({ ...tokenConfig, totalSupply: parseInt(e.target.value) })}
            min="1"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formField}>
          <div className={styles.labelContainer}>
            <label className={styles.label}>
              Token Image URL
            </label>
            <span className={styles.tooltip} title="URL to your token's image (PNG, JPG recommended)">ℹ️</span>
          </div>
          <input
            type="url"
            value={tokenConfig.image}
            onChange={(e) => onChange({ ...tokenConfig, image: e.target.value })}
            className={styles.input}
            placeholder="https://example.com/token-image.png"
          />
        </div>

        <div className={styles.formField}>
          <div className={styles.labelContainer}>
            <label className={styles.label}>
              Description
            </label>
            <span className={styles.tooltip} title="A brief description of your token">ℹ️</span>
          </div>
          <textarea
            value={tokenConfig.description}
            onChange={(e) => onChange({ ...tokenConfig, description: e.target.value })}
            className={styles.input}
            placeholder="Describe your token..."
            rows={3}
          />
        </div>
      </div>

      <div className={styles.features}>
        <h3>Token Features</h3>
        <div className={styles.featureGrid}>
          {Object.keys(tokenConfig.features).map(key => (
            <div className={styles.featureField} key={key}>
              <label className={styles.featureLabel}>
                <input
                  type="checkbox"
                  checked={tokenConfig.features[key]}
                  onChange={(e) => onChange({
                    ...tokenConfig,
                    features: { ...tokenConfig.features, [key]: e.target.checked }
                  })}
                  className={styles.checkbox}
                />
                <div className={styles.featureLabelContent}>
                  <span>{key}</span>
                  <span className={styles.tooltip} title={getFeatureDescription(key)}>ℹ️</span>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.buttonContainer}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={!isWalletConnected}
        >
          Create Token
        </button>
      </div>
    </form>
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