import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Explicitly include the polyfills we need
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Include specific Node.js modules
      include: ['events', 'util', 'stream', 'buffer', 'process'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['simple-peer'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/simple-peer/, /node_modules/],
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
