import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: ['es2015', 'chrome75'], // Chrome 75対応
    minify: 'esbuild',
    sourcemap: false,
    // Chrome 75で確実に動作するように設定
    rollupOptions: {
      output: {
        // より互換性の高い形式で出力
        format: 'es',
        // チャンクサイズを調整
        manualChunks: undefined
      }
    }
  },
  // 古いブラウザ向けのポリフィルを追加
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2015'
    }
  }
})

