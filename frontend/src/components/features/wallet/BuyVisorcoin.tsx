import React, { useState } from 'react';
import styles from '@/styles/BuyVisorcoin.module.css';

interface BuyVisorcoinProps {
  onPurchase: (amount: number) => Promise<void>;
  className?: string;
}

export const BuyVisorcoin: React.FC<BuyVisorcoinProps> = ({ onPurchase, className = '' }) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedXRV, setEstimatedXRV] = useState<number>(0);

  // Mock exchange rate - In production, this would come from your backend
  const XRV_RATE = 0.1; // $0.10 per XRV

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numAmount = parseFloat(value);
    if (!isNaN(numAmount)) {
      setEstimatedXRV(numAmount / XRV_RATE);
    } else {
      setEstimatedXRV(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      await onPurchase(numAmount);
      setAmount('');
      setEstimatedXRV(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase Visorcoin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.buyContainer} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Buy Visorcoin (XRV)</h3>
        <div className={styles.rate}>1 XRV = ${XRV_RATE}</div>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="amount" className={styles.label}>
            Amount (USD)
          </label>
          <div className={styles.inputWrapper}>
            <span className={styles.currencySymbol}>$</span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={styles.input}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          {estimatedXRV > 0 && (
            <div className={styles.estimatedAmount}>
              Estimated XRV: {estimatedXRV.toFixed(2)} XRV
            </div>
          )}
        </div>
        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={styles.button}
        >
          {isLoading ? 'Processing...' : 'Buy Visorcoin'}
        </button>
      </form>
    </div>
  );
}; 