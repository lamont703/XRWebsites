import { useConnection } from '@solana/wallet-adapter-react';

export const useSolanaConnection = () => {
  const { connection } = useConnection();
  return connection;
}; 