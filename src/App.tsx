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
  const [countdown, setCountdown] = useState<number>(Math.floor(INTERVAL_MS / 1000))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const showWeeklyWeatherRef = useRef(showWeeklyWeather)
  
  // showWeeklyWeatherの最新値をrefに保持
  useEffect(() => {
    showWeeklyWeatherRef.current = showWeeklyWeather
  }, [showWeeklyWeather])

  // 週間天気予報を表示するイベントをリッスン
  useEffect(() => {
    const handleShowWeeklyWeather = (event: Event) => {
      console.log('週間天気予報を表示するイベントを受信しました', event)
      setShowWeeklyWeather(true)
      showWeeklyWeatherRef.current = true
      // カウントダウンタイマーを停止
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      setCountdown(0)
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
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    
    // 週間天気予報を表示する関数
    const showWeather = () => {
      console.log('週間天気予報を表示します:', new Date().toLocaleTimeString())
      setShowWeeklyWeather(true)
      showWeeklyWeatherRef.current = true
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      setCountdown(0)
    }

    // カウントダウンを開始する関数
    const startCountdown = () => {
      // 既に表示中の場合はスキップ
      if (showWeeklyWeatherRef.current) {
        return
      }
      
      const seconds = Math.floor(INTERVAL_MS / 1000)
      console.log('カウントダウンを開始します:', seconds, '秒')
      setCountdown(seconds)
      
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev === undefined) {
            return seconds
          }
          const next = prev - 1
          console.log('カウントダウン更新:', next, 'showWeeklyWeather:', showWeeklyWeatherRef.current)
          if (next <= 0) {
            console.log('カウントダウン終了。週間天気予報を表示します')
            if (countdownRef.current) {
              clearInterval(countdownRef.current)
              countdownRef.current = null
            }
            // 次のティックで実行されるようにする
            setTimeout(() => {
              showWeather()
            }, 0)
            return 0
          }
          return next
        })
      }, 1000)
    }
    
    // タイマーを開始
    console.log('週間天気予報タイマーを開始します（', INTERVAL_MS / 1000, '秒ごと）')
    console.log('現在時刻:', new Date().toLocaleTimeString())
    console.log('次の表示時刻:', new Date(Date.now() + INTERVAL_MS).toLocaleTimeString())
    
    // 初回カウントダウンを開始（表示中でない場合のみ）
    if (!showWeeklyWeatherRef.current) {
      startCountdown()
    }
    
    // 定期的にカウントダウンをリセット
    intervalRef.current = setInterval(() => {
      console.log('タイマーが発火しました。カウントダウンをリセットします:', new Date().toLocaleTimeString())
      if (!showWeeklyWeatherRef.current) {
        startCountdown()
      }
    }, INTERVAL_MS)

    return () => {
      console.log('週間天気予報タイマーを停止します')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
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

  // 週間天気予報が閉じられたときにカウントダウンを再開
  const isFirstMount = useRef(true)
  useEffect(() => {
    // 初回マウント時はスキップ
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    
    if (!showWeeklyWeather) {
      // 既存のタイマーをクリア
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      
      // カウントダウンを再開
      const seconds = Math.floor(INTERVAL_MS / 1000)
      console.log('週間天気予報が閉じられました。カウントダウンを再開します:', seconds, '秒')
      setCountdown(seconds)
      
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev === undefined) {
            return seconds
          }
          const next = prev - 1
          console.log('カウントダウン更新（再開後）:', next, 'showWeeklyWeather:', showWeeklyWeatherRef.current)
          if (next <= 0) {
            console.log('カウントダウン終了（再開後）。週間天気予報を表示します')
            if (countdownRef.current) {
              clearInterval(countdownRef.current)
              countdownRef.current = null
            }
            // 次のティックで実行されるようにする
            setTimeout(() => {
              setShowWeeklyWeather(true)
              showWeeklyWeatherRef.current = true
            }, 0)
            return 0
          }
          return next
        })
      }, 1000)
    }
  }, [showWeeklyWeather, INTERVAL_MS])

  // 全画面表示の場合
  if (showWeeklyWeather) {
    console.log('週間天気予報をレンダリング中...', showWeeklyWeather)
    try {
      return (
        <div className="app app-fullscreen">
          <WeeklyWeather />
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
      {/* カウントダウン表示 - 常に表示 */}
      <div 
        className="app-countdown" 
        style={{ 
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 99999,
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          background: 'rgba(255, 0, 0, 0.9)',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          border: '3px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
          minWidth: '250px'
        }}
      >
        <div className="app-countdown-text" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
          週間天気予報まで: {countdown !== null && countdown >= 0 ? countdown : 0}秒
        </div>
      </div>
      
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

