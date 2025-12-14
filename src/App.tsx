import { useState, useEffect } from 'react'
import Clock from './components/Clock'
import News from './components/News'
import TodayWeather from './components/TodayWeather'
import './App.css'

function App() {
  const [showWeather, setShowWeather] = useState(true)

  // ニュースと天気を交互に表示（30秒ごとに切り替え）
  useEffect(() => {
    const interval = setInterval(() => {
      setShowWeather(prev => !prev)
    }, 30000) // 30秒ごとに切り替え

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      {/* 左側1/3: 日付と時刻 */}
      <div className="app-left">
        <Clock />
      </div>
      
      {/* 右側2/3: ニュースと天気を交互に表示 */}
      <div className="app-right">
        {showWeather ? (
          <TodayWeather />
        ) : (
          <News />
        )}
      </div>
    </div>
  )
}

export default App

