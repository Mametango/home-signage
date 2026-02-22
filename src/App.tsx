import { useEffect, useState } from 'react'
import Clock from './components/Clock'
import News from './components/News'
import './App.css'

// バージョン情報（ビルド時に注入される）
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
const GIT_HASH = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev'
const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString()

const formatLogValue = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value instanceof Error) return `${value.name}: ${value.message}`
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function App() {
  const [debugVisible, setDebugVisible] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const hasParam = params.get('debug') === '1'
    const stored = localStorage.getItem('debugOverlay') === '1'
    return hasParam || stored
  })
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  useEffect(() => {
    if (!debugVisible) return

    const pushLog = (type: string, args: unknown[]) => {
      const message = args.map(formatLogValue).join(' ')
      setDebugLogs((prev) => {
        const next = [...prev, `[${type}] ${message}`]
        return next.slice(-200)
      })
    }

    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    console.log = (...args) => {
      pushLog('log', args)
      originalLog(...args)
    }
    console.warn = (...args) => {
      pushLog('warn', args)
      originalWarn(...args)
    }
    console.error = (...args) => {
      pushLog('error', args)
      originalError(...args)
    }

    const handleError = (event: ErrorEvent) => {
      pushLog('window.error', [event.message, event.filename, event.lineno, event.colno])
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      pushLog('unhandledrejection', [event.reason])
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [debugVisible])

  // 通常表示
  return (
    <div className="app-container">
      <div className="app">
        <div className="app-bento-grid">
          {/* Column 1: Time, Weather & Forecast */}
          <div className="bento-col-1-time">
            {/* @ts-ignore */}
            <Clock renderMode="time" />
          </div>

          {/* Column 2: News Feed */}
          <div className="bento-col-2-news">
            <News />
          </div>
        </div>

        {/* バージョン情報 */}
        <div className="app-version">
          <div className="app-version-text">
            v{APP_VERSION} ({GIT_HASH})
          </div>
          <div className="app-version-date">
            {new Date(BUILD_DATE).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {debugVisible && (
          <div className="debug-overlay">
            <div className="debug-overlay-header">
              <div className="debug-overlay-title">Debug Overlay</div>
              <button
                className="debug-overlay-close"
                onClick={() => {
                  localStorage.setItem('debugOverlay', '0')
                  setDebugVisible(false)
                }}
              >
                ✕
              </button>
            </div>
            <div className="debug-overlay-meta">
              <div>UA: {navigator.userAgent}</div>
              <div>v{APP_VERSION} ({GIT_HASH})</div>
              <div>{new Date(BUILD_DATE).toLocaleString('ja-JP')}</div>
            </div>
            <div className="debug-overlay-body">
              {debugLogs.length === 0 ? (
                <div className="debug-overlay-empty">ログ待機中...</div>
              ) : (
                debugLogs.map((line, index) => (
                  <div key={`${index}-${line}`} className="debug-overlay-line">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

