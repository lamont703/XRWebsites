import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true,
    }) as any
  ],
  server: {
    port: 8080,
    host: true
  },
  define: {
    'global': 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
    include: [
      'buffer',
      'crypto-browserify',
      'stream-browserify',
      '@metaplex-foundation/umi-uploader-bundlr'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'stream': 'stream-browserify',
      'crypto': 'crypto-browserify',
      'buffer': 'buffer'
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer'],
          process: ['process/browser', 'default']
        })
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
      defaultIsModuleExports: 'auto'
    }
  }
});
