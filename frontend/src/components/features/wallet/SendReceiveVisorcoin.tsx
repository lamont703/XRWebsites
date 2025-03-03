import React, { useState } from 'react';

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
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Send/Receive XRV</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsReceiveMode(false)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              !isReceiveMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Switch to send mode"
            aria-label="Switch to send mode"
          >
            Send
          </button>
          <button
            onClick={() => setIsReceiveMode(true)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              isReceiveMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Switch to receive mode"
            aria-label="Switch to receive mode"
          >
            Receive
          </button>
        </div>
      </div>

      {isReceiveMode ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Your Wallet Address
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={walletAddress}
                readOnly
                className="bg-gray-700 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Your wallet address"
                aria-label="Your wallet address"
              />
              <button
                onClick={copyToClipboard}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                title="Copy wallet address to clipboard"
                aria-label="Copy wallet address"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-400">
              Share this address to receive Visorcoin (XRV) from other users.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-400 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              id="recipient"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter XRV address"
              title="Recipient wallet address"
              aria-label="Recipient wallet address"
            />
          </div>
          <div>
            <label htmlFor="sendAmount" className="block text-sm font-medium text-gray-400 mb-2">
              Amount (XRV)
            </label>
            <input
              type="number"
              id="sendAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              min="0"
              title="Amount of Visorcoin to send"
              aria-label="Amount of Visorcoin to send"
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Send Visorcoin to recipient"
            aria-label="Send Visorcoin"
          >
            {isLoading ? 'Processing...' : 'Send Visorcoin'}
          </button>
        </form>
      )}
    </div>
  );
}; 