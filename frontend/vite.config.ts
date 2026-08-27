import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 15173,
    host: true,
    proxy: {
      '/api': 'http://localhost:18080',
      '/ws': {
        target: 'http://localhost:18080',
        ws: true
      }
    }
  }
})
