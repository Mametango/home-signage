import { useState, useEffect } from 'react'
import { format, addHours, setHours, setMinutes } from 'date-fns'
import { getSettings } from './Settings'
import WeatherMap from './WeatherMap'
import './Weather.css'

interface WeatherData {
  temp: number
  condition: string
  icon: string
  prefecture: string
  city: string
}

interface HourlyForecast {
  time: Date
  temp: number
  condition: string
  icon: string
}

const Weather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [prefecture, setPrefecture] = useState<string>('東京都')
  const [city, setCity] = useState<string>('')

  // 設定を読み込み
  useEffect(() => {
    const loadSettings = () => {
      const settings = getSettings()
      setPrefecture(settings.prefecture)
      setCity(settings.city || '')
    }

    loadSettings()
    
    // 設定変更イベントを監視
    const handleSettingsChange = () => {
      loadSettings()
    }
    window.addEventListener('settingsChanged', handleSettingsChange)

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange)
    }
  }, [])

  useEffect(() => {
    // 天気APIの例（OpenWeatherMapなど）
    // 実際の使用時はAPIキーが必要です
    const fetchWeather = async () => {
      try {
        // ここに実際の天気APIを実装
        // 例: const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${prefecture}&appid=YOUR_API_KEY&units=metric&lang=ja`)
        // 今回はモックデータを使用
        setTimeout(() => {
          const weatherData = {
            temp: 22,
            condition: '晴れ',
            icon: '☀️',
            prefecture: prefecture,
            city: city
          }
          
          setWeather(weatherData)
          
          // 天気情報変更イベントを発火（背景色更新用）
          window.dispatchEvent(new CustomEvent('weatherChanged', { 
            detail: { condition: weatherData.condition } 
          }))

          // 2時間後から始めて、区切りの良い時間（12時、14時、16時など）に表示
          const now = new Date()
          
          // 2時間後の時刻を計算
          const twoHoursLater = addHours(now, 2)
          let nextHour = twoHoursLater.getHours()
          
          // 次の区切りの良い時間（偶数時）に調整
          if (nextHour % 2 !== 0) {
            nextHour = (nextHour + 1) % 24
          }
          
          // 最初の予報時刻を設定（次の区切りの良い時間）
          let forecastTime = setHours(setMinutes(now, 0), nextHour)
          if (forecastTime <= now) {
            forecastTime = addHours(forecastTime, 2)
          }
          
          const forecast: HourlyForecast[] = []
          const conditions = ['晴れ', '曇り', '雨', '晴れ', '曇り']
          const icons = ['☀️', '☁️', '🌧️', '☀️', '☁️']
          
          // 7個の予報を生成（2時間おき、区切りの良い時間）
          for (let i = 0; i < 7; i++) {
            const time = addHours(forecastTime, i * 2)
            const conditionIndex = i % conditions.length
            forecast.push({
              time: time,
              temp: 20 + Math.floor(Math.random() * 8) - 2, // 18-26度の範囲
              condition: conditions[conditionIndex],
              icon: icons[conditionIndex]
            })
          }
          
          setHourlyForecast(forecast)
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error('天気情報の取得に失敗しました:', error)
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [prefecture, city])

  if (loading) {
    return (
      <div className="weather-full">
        <div className="weather-loading">読み込み中...</div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="weather-full">
        <div className="weather-loading">天気情報が取得できませんでした</div>
      </div>
    )
  }

  return (
    <div className="weather-full">
      <div className="weather-full-header">
        <div className="weather-full-icon">{weather.icon}</div>
        <div className="weather-full-main">
          <div className="weather-full-temp">{weather.temp}°C</div>
          <div className="weather-full-condition">{weather.condition}</div>
          <div className="weather-full-location">
            {weather.city ? `${weather.prefecture} ${weather.city}` : weather.prefecture}
          </div>
        </div>
      </div>
      <div className="weather-full-details">
        <div className="weather-detail-item">
          <span className="weather-detail-label">湿度</span>
          <span className="weather-detail-value">65%</span>
        </div>
        <div className="weather-detail-item">
          <span className="weather-detail-label">風速</span>
          <span className="weather-detail-value">5km/h</span>
        </div>
        <div className="weather-detail-item">
          <span className="weather-detail-label">気圧</span>
          <span className="weather-detail-value">1013hPa</span>
        </div>
      </div>
      
      {/* 地図と天気表示 */}
      <WeatherMap
        prefecture={weather.prefecture}
        city={weather.city}
        condition={weather.condition}
      />
      
      {/* 時刻別天気予報 */}
      <div className="weather-hourly-forecast">
        <h3 className="weather-hourly-title">時刻別予報（2時間おき）</h3>
        <div className="weather-hourly-list">
          {hourlyForecast.map((forecast, index) => (
            <div key={index} className="weather-hourly-item">
              <div className="weather-hourly-time">
                {format(forecast.time, 'HH時')}
              </div>
              <div className="weather-hourly-icon">{forecast.icon}</div>
              <div className="weather-hourly-temp">{forecast.temp}°C</div>
              <div className="weather-hourly-condition">{forecast.condition}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Weather
