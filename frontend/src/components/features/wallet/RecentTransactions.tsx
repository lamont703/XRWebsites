import React from 'react';
import styles from '@/styles/RecentTransactions.module.css';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'purchase' | 'sale';
  amount: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  details?: {
    source?: string;
    payment_intent_id?: string;
    item_name?: string;
  };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
  className?: string;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  isLoading,
  className = ''
}) => {
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return '↑';
      case 'receive':
        return '↓';
      case 'purchase':
        return '🛒';
      case 'sale':
        return '💰';
      default:
        return '•';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return 'text-red-400';
      case 'receive':
        return 'text-green-400';
      case 'purchase':
        return 'text-orange-400';
      case 'sale':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <h3 className={styles.title}>Recent Transactions</h3>
      
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
        </div>
      ) : transactions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No recent transactions</p>
        </div>
      ) : (
        <div className={styles.transactionsList}>
          {transactions.map((transaction) => (
            <div key={transaction.id} className={styles.transactionItem}>
              <div className={styles.transactionLeft}>
                <div className={`${styles.transactionIcon} ${getTransactionColor(transaction.type)}`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className={styles.transactionDetails}>
                  <div className={styles.transactionType}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    {transaction.details?.item_name && ` - ${transaction.details.item_name}`}
                  </div>
                  <div className={styles.transactionTimestamp}>
                    {formatDate(transaction.timestamp)}
                  </div>
                </div>
              </div>
              <div className={styles.transactionRight}>
                <div className={`${styles.transactionAmount} ${getTransactionColor(transaction.type)}`}>
                  {transaction.type === 'send' ? '-' : '+'}${transaction.amount}
                </div>
                <div className={styles.transactionStatus}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 