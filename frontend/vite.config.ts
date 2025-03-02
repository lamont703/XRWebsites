import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip', // Enables Gzip compression
      ext: '.gz', // Adds .gz extension to compressed files
      threshold: 1024, // Compress files larger than 1KB
      deleteOriginFile: false, // Keeps original files while adding .gz versions
    }),
  ],
  server: {
    port: parseInt(process.env.VITE_PORT || '8080'), // Default port
    host: true, // Allow external access (useful for testing on other devices)
    open: false, // Prevents auto-opening browser in CI/CD
    hmr: {
      overlay: true, // Show errors in browser overlay
    },
    watch: {
      usePolling: true, // Ensures file changes are detected properly
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Simplifies imports using '@'
    },
  },
  css: {
    devSourcemap: true, // Enables source maps for easier debugging in development
  },
  build: {
    sourcemap: false, // Disables source maps in production for smaller build size
    outDir: 'dist', // Ensures the correct output folder for deployment
    emptyOutDir: true, // Clears old build files before building
    minify: 'esbuild', // Fast minification
    target: 'esnext', // Uses modern JavaScript for better performance
    copyPublicDir: false, // Prevents unnecessary copying of 'public' folder
    chunkSizeWarningLimit: 1000, // Warns if chunks exceed 1MB
  },
});
