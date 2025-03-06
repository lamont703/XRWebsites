import React, { useState } from 'react';
import styles from '@/styles/SendReceiveVisorcoin.module.css';

interface SendReceiveVisorcoinProps {
  onSend: (address: string, amount: number) => Promise<void>;
  walletAddress?: string;
  className?: string;
}

export const SendReceiveVisorcoin: React.FC<SendReceiveVisorcoinProps> = ({ 
  onSend, 
  walletAddress = '0x...', 
  className = '' 
}) => {
  const [isReceiveMode, setIsReceiveMode] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (!recipientAddress) {
        throw new Error('Please enter a recipient address');
      }
      await onSend(recipientAddress, numAmount);
      setAmount('');
      setRecipientAddress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send Visorcoin');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      // You could add a toast notification here
    } catch (err) {
      setError('Failed to copy address');
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Send/Receive XRV</h3>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => setIsReceiveMode(false)}
            className={`${styles.modeButton} ${!isReceiveMode ? styles.activeButton : styles.inactiveButton}`}
          >
            Send
          </button>
          <button
            onClick={() => setIsReceiveMode(true)}
            className={`${styles.modeButton} ${isReceiveMode ? styles.activeButton : styles.inactiveButton}`}
          >
            Receive
          </button>
        </div>
      </div>

      {isReceiveMode ? (
        <div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              Your Wallet Address
            </label>
            <div className={styles.addressContainer}>
              <input
                type="text"
                value={walletAddress}
                readOnly
                className={styles.input}
                title="Your Wallet Address"
                placeholder="Your wallet address"
              />
              <button
                onClick={copyToClipboard}
                className={styles.copyButton}
              >
                Copy
              </button>
            </div>
          </div>
          <div className={styles.infoBox}>
            <p className={styles.infoText}>
              Share this address to receive Visorcoin (XRV) from other users.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="recipient" className={styles.label}>
              Recipient Address
            </label>
            <input
              type="text"
              id="recipient"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className={styles.input}
              placeholder="Enter XRV address"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="sendAmount" className={styles.label}>
              Amount (XRV)
            </label>
            <input
              type="number"
              id="sendAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.input}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Processing...' : 'Send Visorcoin'}
          </button>
        </form>
      )}
    </div>
  );
}; 