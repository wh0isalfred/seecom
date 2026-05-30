import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [react(),tailwindcss()],
  assetsInclude: ['**/*.glb'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/three'))                  return 'three';
          if (id.includes('node_modules/react-dom'))              return 'vendor';
          if (id.includes('node_modules/react/'))                 return 'vendor';
          if (id.includes('node_modules/@supabase'))              return 'supabase';
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})

