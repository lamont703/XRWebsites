import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      // Expose environment variables to your app
      'import.meta.env.VITE_BACKEND_API_URL': JSON.stringify(process.env.VITE_BACKEND_API_URL || env.VITE_BACKEND_API_URL),
      'import.meta.env.VITE_ENV': JSON.stringify(process.env.VITE_ENV || env.VITE_ENV),
    },
    plugins: [
      react(),
      compression({
        algorithm: 'gzip', // Enables Gzip compression
        ext: '.gz', // Adds .gz extension to compressed files
        threshold: 1024, // Compress files larger than 1KB
        deleteOriginFile: false, // Keeps original files while adding .gz versions
      }),
      {
        name: 'configure-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.endsWith('.js') || req.url?.endsWith('.mjs') || req.url?.endsWith('.ts') || req.url?.endsWith('.tsx')) {
              res.setHeader('Content-Type', 'application/javascript');
            }
            next();
          });
        },
      },
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
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'credentialless'
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // Simplifies imports using '@'
      },
    },
    css: {
      devSourcemap: true, // Enables source maps for easier debugging in development
      modules: {
        // Generate scoped class names
        generateScopedName: '[name]__[local]__[hash:base64:5]',
        // Convert camelCase class names to kebab-case
        localsConvention: 'camelCase',
      },
    },
    build: {
      sourcemap: false, // Disables source maps in production for smaller build size
      outDir: 'dist', // Ensures the correct output folder for deployment
      emptyOutDir: true, // Clears old build files before building
      minify: 'esbuild', // Fast minification
      target: 'esnext', // Uses modern JavaScript for better performance
      copyPublicDir: false, // Prevents unnecessary copying of 'public' folder
      chunkSizeWarningLimit: 1000, // Warns if chunks exceed 1MB
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        }
      },
    },
  };
});
