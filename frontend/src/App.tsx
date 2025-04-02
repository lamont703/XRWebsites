/**
 * App.tsx
 * 
 * This is the main entry point for the application. It sets up the routing, authentication, and query client.
 * It also includes the main layout and handles the authentication guard.
 */ 

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './store/auth/Auth';
import { AuthGuard } from './store/auth/Auth';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider, ConnectionProvider as SolanaConnectionProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { MessageInbox } from '@/components/features/messages/MessageInbox/MessageInbox';
import { Messages } from '@/pages/Messages';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

// Required for wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

// Page imports
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Wallet } from './pages/Wallet';
import { Assets } from './pages/Assets';
import { Jobs } from './pages/Jobs';
import { TokenCreator } from './pages/TokenCreator';
import { Settings } from './pages/Settings';
import { JobMarketplace } from './pages/JobMarketplace';
import { Tokenomics } from './pages/Tokenomics';
import { Forum } from './pages/Forum';
import { PostDetail } from './pages/PostDetail';
import { UserProfile } from '@/pages/UserProfile';
import { NetworkProvider } from '@/providers/NetworkProvider';

// Initialize QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Set up network and endpoint
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => 
    import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network),
    [network]
  );

  // Configure wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    [network] // Add network as dependency since some adapters might need it
  );

  return (
    <NetworkProvider>
      <SolanaConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <BrowserRouter>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <AuthGuard>
                          <Dashboard />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/wallet"
                      element={
                        <AuthGuard>
                          <Wallet />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/nft-assets"
                      element={
                        <AuthGuard>
                          <Assets />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/jobs"
                      element={
                        <AuthGuard>
                          <Jobs />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/token-creator"
                      element={
                        <AuthGuard>
                          <TokenCreator />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <AuthGuard>
                          <Settings />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/marketplace"
                      element={
                        <AuthGuard>
                          <JobMarketplace />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/tokenomics"
                      element={
                        <AuthGuard>
                          <Tokenomics />
                        </AuthGuard>
                      }
                    />
                    <Route path="/forum">
                      <Route
                        index
                        element={
                          <AuthGuard>
                            <Forum />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="posts/:id"
                        element={
                          <AuthGuard>
                            <PostDetail />
                          </AuthGuard>
                        }
                      />
                    </Route>
                    <Route 
                      path="/users/:userId" 
                      element={
                        <AuthGuard>
                          <UserProfile />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/messages/inbox" 
                      element={
                        <AuthGuard>
                          <MessageInbox />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/messages/:userId" 
                      element={
                        <AuthGuard>
                          <Messages />
                        </AuthGuard>
                      } 
                    />

                    {/* Redirect root to dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    

                    {/* 404 Route */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AuthProvider>
              </QueryClientProvider>
            </BrowserRouter>
          </WalletModalProvider>
        </WalletProvider>
      </SolanaConnectionProvider>
    </NetworkProvider>
  );
}

export default App; 