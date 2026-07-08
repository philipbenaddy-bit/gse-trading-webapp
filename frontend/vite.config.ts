import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Raise the warning threshold slightly — we have a rich app
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — always cached
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // State & data fetching
          'vendor-state': ['zustand', 'react-query'],

          // Form handling
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Charts — heavy, split out
          'vendor-charts': ['recharts'],
          'vendor-trading-charts': ['lightweight-charts'],

          // Animation — loaded with pages that use it
          'vendor-motion': ['framer-motion'],

          // UI utilities
          'vendor-ui': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react'],

          // Date utilities
          'vendor-date': ['date-fns'],

          // Network
          'vendor-network': ['axios', 'socket.io-client'],
        },
      },
    },
  },

  // Optimise dev server pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'recharts',
      'lightweight-charts',
      'zustand',
      'react-query',
      'axios',
      'clsx',
      'lucide-react',
      'date-fns',
    ],
  },
});
