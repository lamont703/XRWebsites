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
              
          // Data fetching
          if (id.includes('@tanstack/react-query') ||
              id.includes('swr')) return 'data-fetching';
          
          // Routing chunks
          if (id.includes('react-router') ||
              id.includes('history')) return 'routing';
              
          // UI Framework chunks
          if (id.includes('tailwindcss') ||
              id.includes('@headlessui') ||
              id.includes('@heroicons')) return 'ui-framework';
              
          // Authentication related
          if (id.includes('jwt-decode') ||
              id.includes('auth') ||
              id.includes('cookie')) return 'auth';
          
          // Solana-related chunks
          if (id.includes('@solana/web3.js')) return 'solana-core';
          if (id.includes('@solana/spl-token')) return 'solana-token';
          if (id.includes('@solana/wallet-adapter')) return 'solana-wallet';
          if (id.includes('wallet-adapter-react-ui')) return 'solana-wallet-ui';
          
          // Wallet adapters
          if (id.includes('phantom') || 
              id.includes('solflare') || 
              id.includes('torus')) return 'wallet-adapters';
          
          // Ethereum-related chunks
          if (id.includes('viem')) return 'ethereum-vendor';
          
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
          
          // Skip unnecessary chain definitions and type files
          if (assetInfo.name.includes('viem/_esm/chains/definitions') ||
              assetInfo.name.includes('viem/_types') || 
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
              assetInfo.name.includes('@heroicons/') ||
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
    copyPublicDir: false,
    target: 'esnext',
    chunkSizeWarningLimit: 1000
  },
})