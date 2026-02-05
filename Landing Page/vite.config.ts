import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Allow external connections
    port: 5173,
  },
  build: {
    // Optimize build for performance
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['motion/react'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Enable chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Optimize assets
    assetsInlineLimit: 4096,
    // Minify (use esbuild which is faster and built-in)
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'motion/react', 'lucide-react'],
  },
})
