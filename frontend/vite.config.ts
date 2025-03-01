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
          if (id.includes('react')) return 'react-vendor';
          if (id.includes('@solana/')) return 'solana-vendor';
          if (id.includes('@trezor/')) return 'trezor-vendor';
          if (id.includes('@web3')) return 'web3-vendor';
          if (id.includes('node_modules')) {
            // Split large dependencies into separate chunks
            if (id.includes('buffer')) return 'polyfills';
            if (id.includes('bn.js')) return 'crypto-vendor';
            return 'vendor';
          }
        },
        // Don't copy unnecessary files
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash].[ext]';
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          // Skip .d.ts, .map files, package.json, and README.md
          if (info.includes('d.ts') || info.includes('map') || 
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