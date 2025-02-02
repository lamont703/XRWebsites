import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

interface ConnectWalletProps {
  onConnect?: (address: string) => Promise<void>;
}

export const ConnectWallet = ({ onConnect }: ConnectWalletProps) => {
  const wallet = useWallet();
  const [error, setError] = useState<string | null>(null);

  const handleWalletConnect = async () => {
    try {
      if (wallet.connected && wallet.publicKey && onConnect) {
        await onConnect(wallet.publicKey.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  React.useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      handleWalletConnect();
    }
  }, [wallet.connected, wallet.publicKey]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
      <h3 className="text-xl font-bold text-white mb-4">Connect Wallet</h3>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <p className="text-gray-400 text-sm sm:text-base">
          {wallet.connected 
            ? `Connected: ${wallet.publicKey?.toString().slice(0, 6)}...${wallet.publicKey?.toString().slice(-4)}`
            : 'Connect your Solana wallet to continue'}
        </p>
        <style jsx global>{`
          .wallet-adapter-button {
            background-color: rgb(37, 99, 235) !important;
            transition-property: background-color, border-color, color, fill, stroke !important;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
            transition-duration: 150ms !important;
          }
          .wallet-adapter-button:hover {
            background-color: rgb(29, 78, 216) !important;
          }
          .wallet-adapter-button:not([disabled]) {
            background-color: rgb(37, 99, 235) !important;
          }
          .wallet-adapter-button:not([disabled]):hover {
            background-color: rgb(29, 78, 216) !important;
          }
        `}</style>
        <WalletMultiButton 
          className="!bg-blue-600 !hover:bg-blue-700 !rounded-lg !px-4 !py-3 !h-auto !text-sm sm:!text-base !font-medium !transition-colors w-full sm:w-auto"
        />
      </div>
      {error && (
        <div className="text-red-500 mt-4 text-sm">{error}</div>
      )}
    </div>
  );
}; 