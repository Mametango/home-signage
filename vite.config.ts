import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

// バージョン情報を取得
function getVersionInfo() {
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
    const version = packageJson.version || '1.0.0'
    
    // Gitコミットハッシュを取得（エラー時は空文字）
    let gitHash = ''
    try {
      gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    } catch (e) {
      gitHash = 'unknown'
    }
    
    // ビルド日時
    const buildDate = new Date().toISOString()
    
    return {
      version,
      gitHash,
      buildDate
    }
  } catch (e) {
    return {
      version: '1.0.0',
      gitHash: 'unknown',
      buildDate: new Date().toISOString()
    }
  }
}

const versionInfo = getVersionInfo()

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(versionInfo.version),
    __GIT_HASH__: JSON.stringify(versionInfo.gitHash),
    __BUILD_DATE__: JSON.stringify(versionInfo.buildDate)
  },
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

