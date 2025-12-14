import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// デバッグ情報を出力
console.log('Main.tsx loaded')
console.log('React version:', React.version)
console.log('ReactDOM.createRoot available:', typeof ReactDOM.createRoot === 'function')

// エラーハンドリングを追加
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="padding: 20px; color: white; background: red;">エラー: ルート要素が見つかりません</div>'
} else {
  console.log('Root element found, attempting to render...')
  try {
    // React 18の新しいAPIを使用
    if (typeof ReactDOM.createRoot === 'function') {
      console.log('Using ReactDOM.createRoot')
      const root = ReactDOM.createRoot(rootElement)
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      )
      console.log('React app rendered successfully')
    } else {
      throw new Error('ReactDOM.createRoot is not available')
    }
  } catch (error) {
    console.error('React rendering error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error && error.stack ? error.stack : ''
    rootElement.innerHTML = `
      <div style="padding: 20px; color: white; background: red; font-family: sans-serif;">
        <h1>エラーが発生しました</h1>
        <p>ブラウザの互換性の問題の可能性があります。</p>
        <p><strong>エラー詳細:</strong> ${errorMessage}</p>
        <pre style="font-size: 12px; overflow: auto; background: rgba(0,0,0,0.3); padding: 10px; margin-top: 10px;">${errorStack}</pre>
        <p><strong>ブラウザ情報:</strong> ${navigator.userAgent}</p>
        <p><strong>Chrome バージョン:</strong> ${(() => { const match = navigator.userAgent.match(/Chrome\/(\d+)/); return match ? match[1] : 'Unknown'; })()}</p>
        <p>JavaScriptが有効になっているか確認してください。</p>
      </div>
    `
  }
}

