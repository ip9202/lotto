import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    },
    allowedHosts: [
      'localhost',
      'lotto-frontend-production.up.railway.app',
      '.up.railway.app'  // 모든 Railway 도메인 허용
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})