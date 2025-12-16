import { useState, useEffect, useRef } from 'react'
import Clock from './components/Clock'
import News from './components/News'
import WeeklyWeather from './components/WeeklyWeather'
import './App.css'

function App() {
  // 週間天気予報の表示間隔（5分ごと）
  const INTERVAL_MS = 300000 // 5分ごと（300秒）
  
  const [showWeeklyWeather, setShowWeeklyWeather] = useState(false)
  const [countdown, setCountdown] = useState<number>(Math.floor(INTERVAL_MS / 1000))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    
    // 3分（180秒）ごとに全画面で1週間の天気予報を表示
    const showWeather = () => {
      console.log('週間天気予報を表示します:', new Date().toLocaleTimeString())
      setShowWeeklyWeather(true)
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }

    // カウントダウンを開始
    const startCountdown = () => {
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
          console.log('カウントダウン更新:', next)
          if (next <= 0) {
            console.log('カウントダウン終了。週間天気予報を表示します')
            if (countdownRef.current) {
              clearInterval(countdownRef.current)
              countdownRef.current = null
            }
            showWeather()
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
    
    // 初回カウントダウンを開始
    startCountdown()
    
    // 定期的にカウントダウンをリセット
    intervalRef.current = setInterval(() => {
      console.log('タイマーが発火しました。カウントダウンをリセットします:', new Date().toLocaleTimeString())
      startCountdown()
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
        
        // カウントダウンを再開
        const INTERVAL_MS = 300000 // 5分ごと
        const seconds = Math.floor(INTERVAL_MS / 1000)
        setCountdown(seconds)
        
        // カウントダウンタイマーを再開
        if (countdownRef.current) {
          clearInterval(countdownRef.current)
        }
        
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev === null || prev <= 1) {
              console.log('カウントダウン終了。週間天気予報を表示します')
              setShowWeeklyWeather(true)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }, 60000) // 1分（60秒）後に閉じる

      return () => clearTimeout(timer)
    }
  }, [showWeeklyWeather])

  // 全画面表示の場合
  if (showWeeklyWeather) {
    console.log('週間天気予報をレンダリング中...')
    return (
      <div className="app app-fullscreen">
        <WeeklyWeather />
      </div>
    )
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
      
      {/* デバッグ用: カウントダウンの値を表示 */}
      <div style={{ 
        position: 'fixed', 
        top: '5rem', 
        right: '1rem', 
        zIndex: 100000, 
        background: 'rgba(255,0,0,0.9)', 
        padding: '0.5rem 1rem', 
        color: '#fff', 
        fontSize: '0.9rem', 
        borderRadius: '0.25rem',
        border: '2px solid #fff',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
      }}>
        デバッグ: countdown = {String(countdown)}, showWeeklyWeather = {String(showWeeklyWeather)}
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
    </div>
  )
}

export default App

