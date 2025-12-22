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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const showWeeklyWeatherRef = useRef(showWeeklyWeather)
  
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
      {/* 左側: 日時と天気 */}
      <div className="app-left">
        <Clock />
      </div>
      
      {/* 右側: ニュース */}
      <div className="app-right">
        <div className="app-right-card">
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
    </div>
  )
}

export default App

