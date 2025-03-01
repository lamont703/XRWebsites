import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT || '8080'), // Ensure a string is always passed to parseInt
    host: true, // Listen on all local IPs
    open: true, // Open browser on server start
    hmr: {
      overlay: true, // Show errors in browser overlay
    },
    watch: {
      usePolling: true, // Use polling for file changes (better for some systems)
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Enable @ imports
    },
  },
  css: {
    devSourcemap: true, // Enable CSS source maps
  },
  build: {
    sourcemap: false,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // API and networking
          if (id.includes('axios') ||
              id.includes('fetch-intercept') ||
              id.includes('http-client') ||
              id.includes('api-client')) return 'api-client';
              
          // Error handling and monitoring
          if (id.includes('error-boundary') ||
              id.includes('@sentry/') ||
              id.includes('error-tracking') ||
              id.includes('monitoring')) return 'error-handling';
              
          // API Response types and models
          if (id.includes('types/api') ||
              id.includes('models') ||
              id.includes('dto') ||
              id.includes('schemas')) return 'api-types';
          
          // Image optimization and lazy loading
          if (id.includes('lazy-loading') ||
              id.includes('image-optimization') ||
              id.includes('next/image') ||
              id.includes('sharp')) return 'image-optimization';
              
          // State management and effects
          if (id.includes('zustand') ||
              id.includes('jotai') ||
              id.includes('recoil') ||
              id.includes('redux')) return 'state-management';
              
          // Loading and skeleton components
          if (id.includes('react-loading-skeleton') ||
              id.includes('react-content-loader') ||
              id.includes('placeholder')) return 'loading-utils';
              
          // NFT and metadata handling
          if (id.includes('metadata-parser') ||
              id.includes('nft-storage') ||
              id.includes('ipfs')) return 'nft-utils';
          
          // Image and Media handling
          if (id.includes('image-loader') ||
              id.includes('react-image') ||
              id.includes('media-loader')) return 'media-utils';
              
          // Data fetching and state management
          if (id.includes('@tanstack/react-query') ||
              id.includes('swr') ||
              id.includes('@project-serum/borsh') ||
              id.includes('@metaplex') ||
              id.includes('superstruct')) return 'data-fetching';
              
          // Transaction and Web3 utilities
          if (id.includes('web3') ||
              id.includes('transaction') ||
              id.includes('blockchain')) return 'web3-utils';
              
          // Animation and UI effects
          if (id.includes('framer-motion') ||
              id.includes('react-spring') ||
              id.includes('transition')) return 'animations';
          
          // Routing chunks
          if (id.includes('react-router') ||
              id.includes('history')) return 'routing';
              
          // UI Framework chunks (assuming you use these)
          if (id.includes('tailwindcss') ||
              id.includes('@headlessui') ||
              id.includes('@heroicons')) return 'ui-framework';
              
          // Form handling (if you use these)
          if (id.includes('react-hook-form') ||
              id.includes('formik') ||
              id.includes('yup')) return 'forms';
              
          // Authentication related
          if (id.includes('jwt-decode') ||
              id.includes('auth') ||
              id.includes('cookie')) return 'auth';
          
          // UI and Icon libraries
          if (id.includes('@heroicons/')) return 'ui-icons';
          if (id.includes('@headlessui/')) return 'ui-components';
          
          // Solana-related chunks
          if (id.includes('@solana/web3.js')) return 'solana-core';
          if (id.includes('@solana/spl-token')) return 'solana-token';
          if (id.includes('@solana/wallet-adapter')) return 'solana-wallet';
          if (id.includes('wallet-adapter-react-ui')) return 'solana-wallet-ui';
          if (id.includes('@solana/buffer-layout-utils')) return 'solana-utils';
          
          // Wallet adapters and providers
          if (id.includes('phantom') || 
              id.includes('solflare') || 
              id.includes('torus') ||
              id.includes('wallet-standard') ||
              id.includes('wallet-adapter-base')) return 'wallet-adapters';
          
          // Ethereum-related chunks
          if (id.includes('viem') || id.includes('ethereum')) return 'ethereum-vendor';
          if (id.includes('@trezor/')) return 'trezor-vendor';
          
          // Other crypto dependencies
          if (id.includes('bn.js') || 
              id.includes('tweetnacl') || 
              id.includes('secp256k1') || 
              id.includes('ed25519') ||
              id.includes('bs58') ||
              id.includes('buffer-layout') ||
              id.includes('borsh') ||
              id.includes('@project-serum/borsh') ||
              id.includes('@metaplex') ||
              id.includes('superstruct')) return 'crypto-core';
          
          // Development and debugging
          if (id.includes('debug') ||
              id.includes('logger') ||
              id.includes('devtools') ||
              id.includes('performance')) return 'dev-utils';
          
          // Keep existing vendor chunks
          if (id.includes('react')) return 'react-vendor';
          if (id.includes('node_modules')) {
            if (id.includes('buffer')) return 'polyfills';
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash].[ext]';
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          // Skip type definitions and source maps
          if (assetInfo.name.includes('viem/_types') || 
              assetInfo.name.includes('@solana/') ||
              assetInfo.name.includes('@trezor/') ||
              assetInfo.name.includes('wallet-adapter') ||
              assetInfo.name.includes('phantom') ||
              assetInfo.name.includes('solflare') ||
              assetInfo.name.includes('torus') ||
              assetInfo.name.includes('borsh') ||
              assetInfo.name.includes('buffer-layout') ||
              assetInfo.name.includes('@metaplex') ||
              assetInfo.name.includes('superstruct') ||
              assetInfo.name.includes('@heroicons/') ||  // Added Heroicons
              info.includes('d.ts') || 
              info.includes('map') || 
              assetInfo.name.includes('package.json') || 
              assetInfo.name.includes('README.md')) {
            return '';
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    emptyOutDir: true,
    copyPublicDir: false
  },
})