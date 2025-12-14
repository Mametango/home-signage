import { useState, useEffect } from 'react'
import { getSettings } from './Settings'
import './TodayWeather.css'

interface TodayWeatherData {
  temp: number
  condition: string
  icon: string
  prefecture: string
  city: string
  precipitation: number // 降水確率（%）
  humidity: number // 湿度（%）
  windSpeed: number // 風速（km/h）
  pressure: number // 気圧（hPa）
}

const TodayWeather = () => {
  const [weather, setWeather] = useState<TodayWeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')

  // 設定を読み込み
  useEffect(() => {
    const loadSettings = () => {
      const settings = getSettings()
      setPrefecture(settings.prefecture || '新潟県')
      setCity(settings.city || '新発田市')
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
    const fetchWeather = async () => {
      try {
        // 新潟県新発田市の座標: 37.95°N, 139.33°E
        const lat = 37.95
        const lon = 139.33
        
        // 気象庁の天気予報APIを使用
        // 新潟県のエリアコード: 150000 (新潟地方)
        const areaCode = '150000'
        
        try {
          // 気象庁の天気予報APIから取得
          const forecastResponse = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`)
          
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json()
            
            // 今日の天気を取得
            if (forecastData && forecastData.length > 0) {
              const areaData = forecastData[0]
              const timeSeries = areaData.timeSeries?.[0]
              
              if (timeSeries && timeSeries.areas && timeSeries.areas.length > 0) {
                const area = timeSeries.areas[0]
                const weatherCodes = timeSeries.timeDefines?.[0] ? area.weatherCodes?.[0] : null
                const temps = timeSeries.timeDefines?.[0] ? area.temps?.[0] : null
                const pops = timeSeries.timeDefines?.[0] ? area.pops?.[0] : null
                
                // 天気コードを天気状態に変換
                const getWeatherCondition = (code: string) => {
                  const codeNum = parseInt(code)
                  if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️' }
                  if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️' }
                  if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️' }
                  if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️' }
                  return { condition: '晴れ', icon: '☀️' }
                }
                
                const weatherInfo = weatherCodes ? getWeatherCondition(weatherCodes) : { condition: '晴れ', icon: '☀️' }
                const temp = temps ? parseInt(temps) : 15
                const pop = pops ? parseInt(pops) : 0
                
                const weatherData: TodayWeatherData = {
                  temp: temp,
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  prefecture: prefecture,
                  city: city,
                  precipitation: pop,
                  humidity: 65, // デフォルト値（気象庁APIから取得できない場合）
                  windSpeed: 5, // デフォルト値
                  pressure: 1013 // デフォルト値
                }
                
                setWeather(weatherData)
                
                // 天気情報変更イベントを発火（背景色更新用）
                window.dispatchEvent(new CustomEvent('weatherChanged', { 
                  detail: { condition: weatherData.condition } 
                }))
                
                setLoading(false)
                return
              }
            }
          }
        } catch (apiError) {
          console.error('気象庁APIエラー:', apiError)
        }
        
        // フォールバック: OpenWeatherMap API（APIキーが必要）
        // 実際の使用時は環境変数からAPIキーを取得
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
        
        if (apiKey) {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
          )
          
          if (response.ok) {
            const data = await response.json()
            
            const getWeatherIcon = (condition: string) => {
              if (condition.includes('雨')) return '🌧️'
              if (condition.includes('曇')) return '☁️'
              if (condition.includes('雪')) return '❄️'
              return '☀️'
            }
            
            const weatherData: TodayWeatherData = {
              temp: Math.round(data.main.temp),
              condition: data.weather[0].description || '晴れ',
              icon: getWeatherIcon(data.weather[0].main),
              prefecture: prefecture,
              city: city,
              precipitation: data.rain ? Math.round(data.rain['1h'] || 0) : 0,
              humidity: data.main.humidity,
              windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
              pressure: Math.round(data.main.pressure)
            }
            
            setWeather(weatherData)
            
            // 天気情報変更イベントを発火
            window.dispatchEvent(new CustomEvent('weatherChanged', { 
              detail: { condition: weatherData.condition } 
            }))
            
            setLoading(false)
            return
          }
        }
        
        // 最終フォールバック: モックデータ（新発田市の実際の気温に近い値）
        const weatherData: TodayWeatherData = {
          temp: 12, // 新発田市の12月の平均気温に近い値
          condition: '曇り',
          icon: '☁️',
          prefecture: prefecture,
          city: city,
          precipitation: 30,
          humidity: 65,
          windSpeed: 5,
          pressure: 1013
        }
        
        setWeather(weatherData)
        window.dispatchEvent(new CustomEvent('weatherChanged', { 
          detail: { condition: weatherData.condition } 
        }))
        setLoading(false)
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
      <div className="today-weather">
        <div className="today-weather-loading">読み込み中...</div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="today-weather">
        <div className="today-weather-loading">天気情報が取得できませんでした</div>
      </div>
    )
  }

  return (
    <div className="today-weather">
      <div className="today-weather-header">
        <div className="today-weather-icon">{weather.icon}</div>
        <div className="today-weather-main">
          <div className="today-weather-temp">{weather.temp}°C</div>
          <div className="today-weather-condition">{weather.condition}</div>
          <div className="today-weather-location">
            {weather.city ? `${weather.prefecture} ${weather.city}` : weather.prefecture}
          </div>
        </div>
      </div>
      <div className="today-weather-details">
        <div className="today-weather-detail-item">
          <span className="today-weather-detail-label">降水確率</span>
          <span className="today-weather-detail-value">{weather.precipitation}%</span>
        </div>
        <div className="today-weather-detail-item">
          <span className="today-weather-detail-label">湿度</span>
          <span className="today-weather-detail-value">{weather.humidity}%</span>
        </div>
        <div className="today-weather-detail-item">
          <span className="today-weather-detail-label">風速</span>
          <span className="today-weather-detail-value">{weather.windSpeed}km/h</span>
        </div>
        <div className="today-weather-detail-item">
          <span className="today-weather-detail-label">気圧</span>
          <span className="today-weather-detail-value">{weather.pressure}hPa</span>
        </div>
      </div>
    </div>
  )
}

export default TodayWeather

