import { useState, useEffect } from 'react'
import Clock from './components/Clock'
import HourlyForecast from './components/HourlyForecast'
import InfoPanel from './components/InfoPanel'
import './App.css'

function App() {
  const [weatherCondition, setWeatherCondition] = useState<string>('晴れ')

  useEffect(() => {
    // 天気情報変更イベントを監視
    const handleWeatherChange = (event: CustomEvent) => {
      const condition = event.detail.condition || '晴れ'
      setWeatherCondition(condition)
    }
    
    window.addEventListener('weatherChanged', handleWeatherChange as EventListener)

    return () => {
      window.removeEventListener('weatherChanged', handleWeatherChange as EventListener)
    }
  }, [])

  // アニメーションクラスを決定
  const getAnimationClass = () => {
    if (weatherCondition === '雨' || weatherCondition.includes('雨')) {
      return 'app-rain'
    } else if (weatherCondition === '雪' || weatherCondition.includes('雪')) {
      return 'app-snow'
    } else if (weatherCondition === '曇り' || weatherCondition.includes('曇')) {
      return 'app-cloudy'
    }
    return ''
  }

  return (
    <div className={`app ${getAnimationClass()}`}>
      <div className="app-left">
        <Clock />
        <HourlyForecast />
      </div>
      <div className="app-right">
        <InfoPanel />
      </div>
    </div>
  )
}

export default App

