import { useState, useEffect, useContext } from 'react';
import { Connection } from '@solana/web3.js';
import { NetworkContext, NetworkType, createConnection, NETWORK_CONFIG } from '@/lib/solana/config';

// Create a custom hook to use the network context
export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [network, setNetwork] = useState<NetworkType>('devnet');
  const [connection, setConnection] = useState(() => createConnection(network));

  useEffect(() => {
    setConnection(createConnection(network));
  }, [network]);

  return (
    <NetworkContext.Provider value={{ network, setNetwork, connection }}>
      {children}
    </NetworkContext.Provider>
  );
}; 