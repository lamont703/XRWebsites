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
    sourcemap: false, // Completely disable sourcemaps
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'solana-vendor': ['@solana/web3.js', '@solana/spl-token'],
        },
      },
      // Add external dependencies that shouldn't be bundled
      external: [
        '@trezor/blockchain-link',
        '@trezor/connect'
      ]
    },
    // Ensure clean dist directory
    emptyOutDir: true,
    // Don't copy node_modules to dist
    copyPublicDir: false,
    // Add these to optimize the build
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
  },
})