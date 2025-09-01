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
      'lottoria.ai.kr',
      'www.lottoria.ai.kr',
      'lotto-frontend-production.up.railway.app',
      '.up.railway.app'  // 모든 Railway 도메인 허용
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 프로덕션에서 소스맵 비활성화
    rollupOptions: {
      output: {
        // 청크 분할로 로딩 성능 최적화
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@heroicons/react'],
          utils: ['axios', 'clsx', 'date-fns']
        }
      }
    },
    // 압축 최적화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 청크 크기 경고 임계값 증가
    chunkSizeWarningLimit: 1000
  },
  // 성능 최적화
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})