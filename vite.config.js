import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.glb'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js in its own chunk — only downloaded when Landing loads
          'three':    ['three'],
          // React core
          'vendor':   ['react', 'react-dom'],
          // Supabase client
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Warn if any chunk exceeds 500KB
    chunkSizeWarningLimit: 500,
  },
})
