import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    hmr: {
      clientPort: 5173,
    },
  },
  build: {
    outDir: 'dist',
  },
})
