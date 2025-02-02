import React, { useState } from 'react';

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
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Buy Visorcoin (XRV)</h3>
        <div className="text-sm text-gray-400">1 XRV = ${XRV_RATE}</div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-2">
            Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-gray-700 text-white rounded-lg pl-8 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          {estimatedXRV > 0 && (
            <div className="mt-2 text-sm text-gray-400">
              Estimated XRV: {estimatedXRV.toFixed(2)} XRV
            </div>
          )}
        </div>
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Processing...' : 'Buy Visorcoin'}
        </button>
      </form>
    </div>
  );
}; 