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
import {} from '@solana/wallet-adapter-base';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { MessageInbox } from '@/components/features/messages/MessageInbox/MessageInbox';
import { Messages } from '@/pages/Messages';

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
import { useMemo } from 'react';
import {} from '@solana/web3.js';

const queryClient = new QueryClient();

function App() {
  // Configure wallet adapters with required features
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter()
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={import.meta.env.VITE_SOLANA_RPC_URL}>
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
    </ConnectionProvider>
  );
}

export default App; 