import React from 'react';

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
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No recent transactions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full ${getTransactionColor(transaction.type)} bg-opacity-20 flex items-center justify-center`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    {transaction.details?.item_name && ` - ${transaction.details.item_name}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(transaction.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                  {transaction.type === 'send' ? '-' : '+'}${transaction.amount}
                </div>
                <div className={`text-xs ${
                  transaction.status === 'completed' ? 'text-green-400' :
                  transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                }`}>
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