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
    target: 'es2015', // Android 7.1対応のためES2015をターゲット
    minify: 'esbuild', // esbuildを使用（terserより高速）
    sourcemap: false // デバッグ用にソースマップを無効化（必要に応じて有効化可能）
  }
})

