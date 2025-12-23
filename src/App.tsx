import { useState, useEffect, useRef } from 'react'
import Clock from './components/Clock'
import News from './components/News'
import WeeklyWeather from './components/WeeklyWeather'
import './App.css'

// バージョン情報（ビルド時に注入される）
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
const GIT_HASH = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev'
const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString()

function App() {
  // 週間天気予報の表示間隔（5分ごと）
  const INTERVAL_MS = 300000 // 5分ごと（300秒）
  
  const [showWeeklyWeather, setShowWeeklyWeather] = useState(false)
  const [rightContentIndex, setRightContentIndex] = useState(0) // 0: 天気, 1: ニュース
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const showWeeklyWeatherRef = useRef(showWeeklyWeather)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  
  // showWeeklyWeatherの最新値をrefに保持
  useEffect(() => {
    showWeeklyWeatherRef.current = showWeeklyWeather
  }, [showWeeklyWeather])

  // 週間天気予報からメイン画面に戻るハンドラ
  const handleBackToMain = () => {
    console.log('メイン画面に戻ります')
    setShowWeeklyWeather(false)
    showWeeklyWeatherRef.current = false
  }

  // 週間天気予報を表示するイベントをリッスン
  useEffect(() => {
    const handleShowWeeklyWeather = (event: Event) => {
      console.log('週間天気予報を表示するイベントを受信しました', event)
      setShowWeeklyWeather(true)
      showWeeklyWeatherRef.current = true
    }

    window.addEventListener('showWeeklyWeather', handleShowWeeklyWeather)

    return () => {
      window.removeEventListener('showWeeklyWeather', handleShowWeeklyWeather)
    }
  }, [])

  useEffect(() => {
    // 既存のタイマーをクリア
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // 週間天気予報を表示する関数
    const showWeather = () => {
      console.log('週間天気予報を表示します:', new Date().toLocaleTimeString())
      setShowWeeklyWeather(true)
      showWeeklyWeatherRef.current = true
    }
    
    // タイマーを開始
    console.log('週間天気予報タイマーを開始します（', INTERVAL_MS / 1000, '秒ごと）')
    console.log('現在時刻:', new Date().toLocaleTimeString())
    console.log('次の表示時刻:', new Date(Date.now() + INTERVAL_MS).toLocaleTimeString())
    
    // 初回表示（表示中でない場合のみ）
    if (!showWeeklyWeatherRef.current) {
      showWeather()
    }
    
    // 定期的に週間天気予報を表示
    intervalRef.current = setInterval(() => {
      console.log('タイマーが発火しました。週間天気予報を表示します:', new Date().toLocaleTimeString())
      if (!showWeeklyWeatherRef.current) {
        showWeather()
      }
    }, INTERVAL_MS)

    return () => {
      console.log('週間天気予報タイマーを停止します')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [INTERVAL_MS])

  // 全画面表示を閉じる（1分後に自動で閉じる）
  useEffect(() => {
    if (showWeeklyWeather) {
      console.log('週間天気予報を表示中。1分後に自動で閉じます')
      const timer = setTimeout(() => {
        console.log('週間天気予報を閉じます:', new Date().toLocaleTimeString())
        setShowWeeklyWeather(false)
      }, 60000) // 1分（60秒）後に閉じる

      return () => clearTimeout(timer)
    }
  }, [showWeeklyWeather])


  // 全画面表示の場合
  if (showWeeklyWeather) {
    console.log('週間天気予報をレンダリング中...', showWeeklyWeather)
    try {
      return (
        <div className="app app-fullscreen">
          <WeeklyWeather onBack={handleBackToMain} />
        </div>
      )
    } catch (error) {
      console.error('週間天気予報のレンダリングエラー:', error)
      return (
        <div className="app app-fullscreen">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#fff',
            fontSize: '2rem'
          }}>
            週間天気予報の読み込み中...
          </div>
        </div>
      )
    }
  }

  // 通常表示
  return (
    <div className="app">
      {/* 左側: 時刻のみ */}
      <div className="app-left">
        <Clock showTimeOnly={true} />
      </div>
      
      {/* 右側: 天気とニュース（スワイプで切り替え） */}
      <div 
        className="app-right"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
          touchStartY.current = e.touches[0].clientY
        }}
        onTouchMove={(e) => {
          if (touchStartX.current === null || touchStartY.current === null) return
          const deltaX = e.touches[0].clientX - touchStartX.current
          const deltaY = e.touches[0].clientY - touchStartY.current
          
          // 横方向のスワイプが縦方向より大きい場合のみ処理
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0 && rightContentIndex === 1) {
              // 右にスワイプ（ニュース → 天気）
              setRightContentIndex(0)
              touchStartX.current = null
              touchStartY.current = null
            } else if (deltaX < 0 && rightContentIndex === 0) {
              // 左にスワイプ（天気 → ニュース）
              setRightContentIndex(1)
              touchStartX.current = null
              touchStartY.current = null
            }
          }
        }}
        onTouchEnd={() => {
          touchStartX.current = null
          touchStartY.current = null
        }}
        onMouseDown={(e) => {
          touchStartX.current = e.clientX
          touchStartY.current = e.clientY
        }}
        onMouseMove={(e) => {
          if (touchStartX.current === null || touchStartY.current === null) return
          if (e.buttons === 0) {
            touchStartX.current = null
            touchStartY.current = null
            return
          }
          const deltaX = e.clientX - touchStartX.current
          const deltaY = e.clientY - touchStartY.current
          
          // 横方向のスワイプが縦方向より大きい場合のみ処理
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0 && rightContentIndex === 1) {
              // 右にスワイプ（ニュース → 天気）
              setRightContentIndex(0)
              touchStartX.current = null
              touchStartY.current = null
            } else if (deltaX < 0 && rightContentIndex === 0) {
              // 左にスワイプ（天気 → ニュース）
              setRightContentIndex(1)
              touchStartX.current = null
              touchStartY.current = null
            }
          }
        }}
        onMouseUp={() => {
          touchStartX.current = null
          touchStartY.current = null
        }}
        onMouseLeave={() => {
          touchStartX.current = null
          touchStartY.current = null
        }}
      >
        <div className="app-right-content">
          <div 
            className={`app-right-weather ${rightContentIndex === 0 ? 'active' : ''}`}
            style={{ display: rightContentIndex === 0 ? 'block' : 'none' }}
          >
            <Clock showWeatherOnly={true} />
          </div>
          <div 
            className={`app-right-news ${rightContentIndex === 1 ? 'active' : ''}`}
            style={{ display: rightContentIndex === 1 ? 'block' : 'none' }}
          >
            <News />
          </div>
        </div>
        {/* インジケーター */}
        <div className="app-right-indicator">
          <div className={`app-right-indicator-dot ${rightContentIndex === 0 ? 'active' : ''}`}></div>
          <div className={`app-right-indicator-dot ${rightContentIndex === 1 ? 'active' : ''}`}></div>
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
    </div>
  )
}

export default App

