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
          
          // React and other vendors
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
          
          // Skip crypto-related type definitions and source maps
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