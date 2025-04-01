import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { NetworkContext, NetworkType, createConnection, NETWORK_CONFIG } from '@/lib/solana/config';

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