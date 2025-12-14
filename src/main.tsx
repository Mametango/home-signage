import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// エラーハンドリングを追加
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="padding: 20px; color: white; background: red;">エラー: ルート要素が見つかりません</div>'
} else {
  try {
    // React 18の新しいAPIを使用
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  } catch (error) {
    console.error('React rendering error:', error)
    rootElement.innerHTML = `
      <div style="padding: 20px; color: white; background: red; font-family: sans-serif;">
        <h1>エラーが発生しました</h1>
        <p>ブラウザの互換性の問題の可能性があります。</p>
        <p>エラー詳細: ${error instanceof Error ? error.message : String(error)}</p>
        <p>ブラウザ情報: ${navigator.userAgent}</p>
        <p>JavaScriptが有効になっているか確認してください。</p>
      </div>
    `
  }
}

